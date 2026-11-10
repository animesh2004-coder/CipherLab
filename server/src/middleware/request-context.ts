import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../observability/logger.js';
import { metrics } from '../observability/telemetry.js';

const requestContextPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.decorateRequest('requestId', '');

  fastify.addHook('onRequest', async (req, reply) => {
    const incomingId = req.headers['x-request-id'];
    const requestId = typeof incomingId === 'string' && incomingId.length > 0 ? incomingId : uuidv4();

    req.requestId = requestId;
    reply.header('x-request-id', requestId);

    (req as unknown as { startTime: number }).startTime = Date.now();
    metrics.recordRequestStart(req.routeOptions?.url || req.url);
  });

  fastify.addHook('onResponse', async (req, reply) => {
    const startTime = (req as unknown as { startTime?: number }).startTime || Date.now();
    const durationMs = Date.now() - startTime;

    metrics.recordRequestEnd(reply.statusCode, durationMs);

    logger.info({
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: reply.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }, 'HTTP Request completed');
  });
};

export const requestContext = fp(requestContextPlugin, {
  name: 'request-context',
});
