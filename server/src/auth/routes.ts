import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import crypto from 'node:crypto';
import { config } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import {
  clearSessionCookie,
  destroySession,
  generateCsrfToken,
  generateSessionId,
  saveSession,
  setSessionCookie,
} from '../middleware/session.js';
import { SessionData } from '../types/session.js';
import { UserRole } from '@cipherlab/shared';

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /auth/session
   * Returns active session state and CSRF token for the frontend.
   */
  fastify.get('/session', async (req, reply) => {
    reply.header('Cache-Control', 'private, no-cache, no-store');

    if (!req.session || !req.session.userId) {
      return { authenticated: false };
    }

    const user = await userRepository.findById(req.session.userId);
    if (!user) {
      await destroySession(req.session.sessionId);
      clearSessionCookie(reply);
      return { authenticated: false };
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      csrfToken: req.session.csrfToken,
    };
  });

  /**
   * POST /auth/logout
   * Invalidates session on server and clears the session cookie.
   */
  fastify.post('/logout', async (req, reply) => {
    reply.header('Cache-Control', 'private, no-cache, no-store');

    if (req.session) {
      await destroySession(req.session.sessionId);
      await auditRepository.create({
        userId: req.session.userId,
        action: 'LOGOUT',
        resourceType: 'session',
        ipAddress: req.ip,
      });
    }

    clearSessionCookie(reply);
    return { success: true, message: 'Logged out successfully.' };
  });

  /**
   * GET /auth/login
   * Initiates OIDC Authorization Code Flow with PKCE.
   */
  fastify.get('/login', async (_req, reply) => {
    reply.header('Cache-Control', 'private, no-cache, no-store');

    // Generate PKCE code_verifier and code_challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    const state = crypto.randomBytes(16).toString('hex');

    // Store verifier and state in temporary cookies for callback verification
    reply.setCookie('oidc_state', state, {
      path: '/auth/callback',
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
    });

    reply.setCookie('oidc_verifier', codeVerifier, {
      path: '/auth/callback',
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300,
    });

    // Build OIDC authorization URL
    const authUrl = new URL(`${config.OIDC_ISSUER_URL}/protocol/openid-connect/auth`);
    authUrl.searchParams.set('client_id', config.OIDC_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', config.OIDC_SCOPES);
    authUrl.searchParams.set('redirect_uri', config.OIDC_REDIRECT_URI);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    return reply.redirect(authUrl.toString());
  });

  /**
   * GET /auth/callback
   * Handles identity provider callback, exchanges code with PKCE, and creates session.
   */
  fastify.get('/callback', async (req, reply) => {
    reply.header('Cache-Control', 'private, no-cache, no-store');

    const query = req.query as { code?: string; state?: string };
    const savedState = req.cookies.oidc_state;
    const codeVerifier = req.cookies.oidc_verifier;

    reply.clearCookie('oidc_state', { path: '/auth/callback' });
    reply.clearCookie('oidc_verifier', { path: '/auth/callback' });

    if (!query.code || !query.state || query.state !== savedState) {
      reply.status(400);
      throw new Error('OIDC authentication failed: State mismatch or missing code.');
    }

    try {
      // Exchange authorization code for tokens
      const tokenEndpoint = `${config.OIDC_ISSUER_URL}/protocol/openid-connect/token`;
      const tokenResponse = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: config.OIDC_CLIENT_ID,
          client_secret: config.OIDC_CLIENT_SECRET,
          code: query.code,
          redirect_uri: config.OIDC_REDIRECT_URI,
          code_verifier: codeVerifier || '',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed with status ${tokenResponse.status}`);
      }

      const tokens = (await tokenResponse.json()) as { access_token: string; id_token: string };

      // Fetch userinfo
      const userInfoEndpoint = `${config.OIDC_ISSUER_URL}/protocol/openid-connect/userinfo`;
      const userinfoResponse = await fetch(userInfoEndpoint, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const userinfo = (await userinfoResponse.json()) as {
        sub: string;
        email?: string;
        name?: string;
        preferred_username?: string;
      };

      // Upsert user in database
      const user = await userRepository.upsertFromOidc({
        externalId: userinfo.sub,
        email: userinfo.email || null,
        displayName: userinfo.name || userinfo.preferred_username || 'Student',
      });

      // Create session
      const sessionId = generateSessionId();
      const sessionData: SessionData = {
        sessionId,
        userId: user.id,
        role: user.role,
        externalId: user.externalId,
        displayName: user.displayName,
        csrfToken: generateCsrfToken(),
        createdAt: Date.now(),
        expiresAt: Date.now() + config.SESSION_MAX_AGE_SECONDS * 1000,
      };

      await saveSession(sessionData);
      setSessionCookie(reply, sessionId);

      await auditRepository.create({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        resourceType: 'session',
        ipAddress: req.ip,
      });

      // Redirect to frontend
      const targetOrigin = config.ALLOWED_ORIGINS[0] || '/';
      return reply.redirect(`${targetOrigin}/?login=success`);
    } catch (err) {
      req.log.error({ err }, 'OIDC callback processing failed');
      const targetOrigin = config.ALLOWED_ORIGINS[0] || '/';
      return reply.redirect(`${targetOrigin}/?login=failed`);
    }
  });

  /**
   * DEV-ONLY TEST AUTH ADAPTER
   * STRICT SECURITY: This route CANNOT be registered when NODE_ENV === 'production'.
   * Allows automated tests and local development when external OIDC credentials
   * are not yet provisioned.
   */
  if (config.NODE_ENV !== 'production') {
    fastify.post('/dev-login', async (req, reply) => {
      reply.header('Cache-Control', 'private, no-cache, no-store');

      const body = (req.body as { displayName?: string; email?: string; role?: UserRole }) || {};
      const displayName = body.displayName || 'Dev Student';
      const email = body.email || `dev-${Date.now()}@cipherlab.local`;
      const role: UserRole = body.role || 'STUDENT';
      const externalId = `dev-oidc-${crypto.createHash('md5').update(email).digest('hex')}`;

      // Upsert dev user
      const user = await userRepository.upsertFromOidc({
        externalId,
        email,
        displayName,
        role,
      });

      // Create session
      const sessionId = generateSessionId();
      const sessionData: SessionData = {
        sessionId,
        userId: user.id,
        role: user.role,
        externalId: user.externalId,
        displayName: user.displayName,
        csrfToken: generateCsrfToken(),
        createdAt: Date.now(),
        expiresAt: Date.now() + config.SESSION_MAX_AGE_SECONDS * 1000,
      };

      await saveSession(sessionData);
      setSessionCookie(reply, sessionId);

      await auditRepository.create({
        userId: user.id,
        action: 'DEV_LOGIN_SUCCESS',
        resourceType: 'session',
        ipAddress: req.ip,
      });

      return {
        success: true,
        user: {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
        },
        csrfToken: sessionData.csrfToken,
      };
    });
  }
};
