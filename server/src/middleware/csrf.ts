import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { config } from '../config/env.js';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

const csrfPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preValidation', async (req, reply) => {
    // 1. Only enforce on state-changing methods
    if (!STATE_CHANGING_METHODS.has(req.method)) {
      return;
    }

    // 2. Exempt OAuth callback and login (protected by OIDC state parameter)
    if (req.url.startsWith('/auth/') || req.url.startsWith('/api/auth/')) {
      return;
    }

    // 3. Exempt health / test routes if any
    if (req.url === '/api/v1/healthz' || req.url === '/api/v1/readyz') {
      return;
    }

    // 4. Origin verification
    const origin = req.headers.origin || req.headers.referer;
    if (origin) {
      try {
        const originUrl = new URL(origin).origin;
        const isAllowed = config.ALLOWED_ORIGINS.some(
          (allowed) => new URL(allowed).origin === originUrl
        );
        if (!isAllowed) {
          reply.status(403);
          throw new Error('CSRF origin check failed: Request origin is not allowed.');
        }
      } catch {
        reply.status(403);
        throw new Error('CSRF origin check failed: Malformed Origin header.');
      }
    }

    // 5. If user is authenticated with a cookie session, enforce double-submit CSRF token
    if (req.session) {
      const headerToken = req.headers['x-csrf-token'];
      if (!headerToken || headerToken !== req.session.csrfToken) {
        reply.status(403);
        throw new Error('CSRF validation failed: Invalid or missing x-csrf-token header.');
      }
    }
  });
};

export const csrfMiddleware = fp(csrfPlugin, {
  name: 'csrf-middleware',
});

