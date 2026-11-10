import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { config } from '../config/env.js';

const securityHeadersPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('onSend', async (_req, reply, payload) => {
    // 1. Prevent MIME sniffing
    reply.header('X-Content-Type-Options', 'nosniff');

    // 2. Clickjacking protection
    reply.header('X-Frame-Options', 'DENY');

    // 3. Referrer policy
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 4. Permissions Policy
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // 5. HSTS (in production)
    if (config.NODE_ENV === 'production') {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // 6. Content-Security-Policy
    // Note: 'unsafe-inline' for style-src allows existing inline CSS in React
    reply.header(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data:; " +
      "connect-src 'self' " + config.ALLOWED_ORIGINS.join(' ') + "; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
    );

    return payload;
  });
};

export const securityHeaders = fp(securityHeadersPlugin, {
  name: 'security-headers',
});
