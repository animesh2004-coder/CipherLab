import { UserRole } from '@cipherlab/shared';

export interface SessionData {
  sessionId: string;
  userId: string;
  role: UserRole;
  externalId: string;
  displayName: string;
  csrfToken: string;
  createdAt: number;
  expiresAt: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    session?: SessionData;
    requestId: string;
  }
}

