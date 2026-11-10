import { Redis } from 'ioredis';
import { config } from '../config/env.js';

declare global {
  // eslint-disable-next-line no-var
  var __cipherlab_redis__: Redis | undefined;
}

export function createRedisClient(): Redis {
  const client = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  });

  client.on('error', (err) => {
    // Avoid crashing on unhandled rejection during reconnection attempts
    console.error('Redis connection error:', err.message);
  });

  return client;
}

export const redis: Redis = globalThis.__cipherlab_redis__ ?? createRedisClient();

if (config.NODE_ENV !== 'production') {
  globalThis.__cipherlab_redis__ = redis;
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const res = await redis.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    if (redis.status === 'ready' || redis.status === 'connecting') {
      await redis.quit();
    }
  } catch {
    redis.disconnect();
  }
}

