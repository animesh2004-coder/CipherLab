import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../database/prisma.js';
import { checkRedisHealth } from '../database/redis.js';
import { ApiHealthResponse, ApiReadyResponse } from '@cipherlab/shared';

export async function healthCheck(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<ApiHealthResponse> {
  reply.header('Cache-Control', 'no-cache, no-store');
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
}

export async function readyCheck(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<ApiReadyResponse> {
  reply.header('Cache-Control', 'no-cache, no-store');

  let dbOk = false;
  let redisOk = false;

  // Timeout promise
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Health check timeout')), 2000)
  );

  try {
    // 1. Check PostgreSQL
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
    dbOk = true;
  } catch {
    dbOk = false;
  }

  try {
    // 2. Check Redis
    redisOk = await Promise.race([checkRedisHealth(), timeoutPromise]);
  } catch {
    redisOk = false;
  }

  const isReady = dbOk && redisOk;
  if (!isReady) {
    reply.status(503);
  }

  return {
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbOk,
      redis: redisOk,
    },
  };
}

