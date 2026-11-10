import Fastify, { FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySensible from '@fastify/sensible';

import { config } from './config/env.js';
import { logger } from './observability/logger.js';
import { requestContext } from './middleware/request-context.js';
import { securityHeaders } from './middleware/security-headers.js';
import { sessionMiddleware } from './middleware/session.js';
import { csrfMiddleware } from './middleware/csrf.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRoutes } from './auth/routes.js';
import { apiRoutes } from './routes/api.js';
import { disconnectPrisma } from './database/prisma.js';
import { disconnectRedis } from './database/redis.js';

/**
 * Builds and configures the Fastify application instance.
 * Exported as a factory function so integration tests can spin up isolated servers.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    loggerInstance: logger as any,
    bodyLimit: 1048576, // 1MB maximum body limit
    trustProxy: config.TRUST_PROXY,
  });

  // 1. Error Utilities
  await app.register(fastifySensible);

  // 2. Cookie Parser
  await app.register(fastifyCookie, {
    secret: config.SESSION_SECRET,
    hook: 'onRequest',
  });

  // 3. CORS with strict allowed origins
  await app.register(fastifyCors, {
    origin: config.ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-csrf-token', 'x-request-id', 'if-none-match'],
    exposedHeaders: ['x-request-id', 'etag'],
    maxAge: 86400,
  });

  // 4. Rate Limiting (Redis-backed in production, falls back to in-memory)
  await app.register(fastifyRateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    allowList: ['127.0.0.1'],
    keyGenerator: (req) => {
      // Rate limit by authenticated session user if logged in, otherwise by IP
      if (req.session?.userId) {
        return `user:${req.session.userId}`;
      }
      return req.ip;
    },
    errorResponseBuilder: (req) => ({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please wait a moment before retrying.',
        requestId: req.requestId || 'unknown',
      },
    }),
  });

  // 5. Custom Security & Context Middleware
  await app.register(requestContext);
  await app.register(securityHeaders);
  await app.register(sessionMiddleware);
  await app.register(csrfMiddleware);

  // 6. Error & 404 Handlers (Registered before routes so all encapsulated plugins inherit them)
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  // 7. Routes
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(apiRoutes, { prefix: '/api/v1' });

  return app;
}

/**
 * Starts the HTTP server process when executed directly.
 */
async function start() {
  try {
    const app = await buildApp();

    // Graceful Shutdown Handlers
    const closeGracefully = async (signal: string) => {
      logger.info({ signal }, 'Graceful shutdown initiated');
      try {
        await app.close();
        await disconnectPrisma();
        await disconnectRedis();
        logger.info('Clean shutdown completed.');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during graceful shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => closeGracefully('SIGTERM'));
    process.on('SIGINT', () => closeGracefully('SIGINT'));

    await app.listen({
      port: config.PORT,
      host: '0.0.0.0',
    });

    logger.info(
      {
        port: config.PORT,
        env: config.NODE_ENV,
        origins: config.ALLOWED_ORIGINS,
      },
      `🚀 CipherLab Production API server started on port ${config.PORT}`
    );
  } catch (err) {
    logger.fatal({ err }, 'Fatal error during server startup');
    process.exit(1);
  }
}

import { pathToFileURL } from 'node:url';

// Auto-start if executed directly as entrypoint
function isDirectEntrypoint(): boolean {
  if (process.env.RUN_SERVER === 'true') return true;
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
}

if (isDirectEntrypoint()) {
  start();
}
