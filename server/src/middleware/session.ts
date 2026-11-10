import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import crypto from 'node:crypto';
import { config } from '../config/env.js';
import { redis } from '../database/redis.js';
import { SessionData } from '../types/session.js';
import { logger } from '../observability/logger.js';

export const SESSION_COOKIE_NAME =
  config.NODE_ENV === 'production' && !config.COOKIE_DOMAIN
    ? '__Host-cipherlab_sid'
    : 'cipherlab_sid';

const SESSION_PREFIX = 'session:';

// In-memory fallback for local unit tests when Redis is not running
const inMemorySessions = new Map<string, { data: string; expiresAt: number }>();

export async function saveSession(session: SessionData): Promise<void> {
  const key = `${SESSION_PREFIX}${session.sessionId}`;
  const serialized = JSON.stringify(session);
  const ttl = config.SESSION_MAX_AGE_SECONDS;

  try {
    if (redis.status === 'ready') {
      await redis.set(key, serialized, 'EX', ttl);
      return;
    }
  } catch (err) {
    logger.warn({ err }, 'Redis saveSession failed, using in-memory fallback');
  }

  // Fallback
  inMemorySessions.set(session.sessionId, {
    data: serialized,
    expiresAt: Date.now() + ttl * 1000,
  });
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  if (!sessionId) return null;
  const key = `${SESSION_PREFIX}${sessionId}`;

  try {
    if (redis.status === 'ready') {
      const data = await redis.get(key);
      if (data) {
        return JSON.parse(data) as SessionData;
      }
      return null;
    }
  } catch (err) {
    logger.warn({ err }, 'Redis getSession failed, checking in-memory fallback');
  }

  const inMem = inMemorySessions.get(sessionId);
  if (inMem) {
    if (Date.now() > inMem.expiresAt) {
      inMemorySessions.delete(sessionId);
      return null;
    }
    return JSON.parse(inMem.data) as SessionData;
  }

  return null;
}

export async function destroySession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  const key = `${SESSION_PREFIX}${sessionId}`;

  try {
    if (redis.status === 'ready') {
      await redis.del(key);
    }
  } catch (err) {
    logger.warn({ err }, 'Redis destroySession failed');
  }

  inMemorySessions.delete(sessionId);
}

export function setSessionCookie(reply: FastifyReply, sessionId: string): void {
  reply.setCookie(SESSION_COOKIE_NAME, sessionId, {
    path: '/',
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: config.COOKIE_DOMAIN,
    maxAge: config.SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: config.COOKIE_DOMAIN,
  });
}

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Rotates session ID to prevent session fixation attacks.
 */
export async function rotateSession(
  req: FastifyRequest,
  reply: FastifyReply,
  existingSession: SessionData
): Promise<SessionData> {
  await destroySession(existingSession.sessionId);

  const newSessionId = generateSessionId();
  const rotated: SessionData = {
    ...existingSession,
    sessionId: newSessionId,
    csrfToken: generateCsrfToken(),
    createdAt: Date.now(),
    expiresAt: Date.now() + config.SESSION_MAX_AGE_SECONDS * 1000,
  };

  await saveSession(rotated);
  setSessionCookie(reply, newSessionId);
  req.session = rotated;

  return rotated;
}

const sessionPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.decorateRequest('session', undefined);

  fastify.addHook('onRequest', async (req) => {
    // Skip session extraction for health checks
    if (req.url === '/api/v1/healthz' || req.url === '/api/v1/readyz') {
      return;
    }

    const sessionId = req.cookies[SESSION_COOKIE_NAME];
    if (sessionId) {
      const session = await getSession(sessionId);
      if (session) {
        req.session = session;
      }
    }
  });
};

export const sessionMiddleware = fp(sessionPlugin, {
  name: 'session-middleware',
});

