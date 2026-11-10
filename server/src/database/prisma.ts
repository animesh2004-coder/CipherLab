import { PrismaClient } from '@prisma/client';
import { config } from '../config/env.js';

declare global {
  // eslint-disable-next-line no-var
  var __cipherlab_prisma__: PrismaClient | undefined;
}

export function createPrismaClient(): PrismaClient {
  const isDev = config.NODE_ENV === 'development';

  const client = new PrismaClient({
    log: isDev ? ['query', 'error', 'warn'] : ['error', 'warn'],
    datasources: {
      db: {
        url: config.DATABASE_URL,
      },
    },
  });

  return client;
}

// Reuse client across hot reloads in development
export const prisma: PrismaClient = globalThis.__cipherlab_prisma__ ?? createPrismaClient();

if (config.NODE_ENV !== 'production') {
  globalThis.__cipherlab_prisma__ = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

