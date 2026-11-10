import { FastifyReply, FastifyRequest } from 'fastify';
import { UserRole } from '@cipherlab/shared';
import { SessionData } from '../types/session.js';

export class UnauthorizedError extends Error {
  statusCode = 401;
  code = 'UNAUTHORIZED';
  constructor(message = 'Authentication required.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  code = 'FORBIDDEN';
  constructor(message = 'Access denied.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Ensures request has an active, valid session.
 * Always derives identity from the session, NEVER from client parameters.
 */
export async function requireAuth(req: FastifyRequest, _reply: FastifyReply): Promise<SessionData> {
  if (!req.session || !req.session.userId) {
    throw new UnauthorizedError('Please sign in to access this resource.');
  }
  return req.session;
}

/**
 * Ensures user possesses one of the allowed roles.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<SessionData> => {
    const session = await requireAuth(req, _reply);
    if (!allowedRoles.includes(session.role)) {
      throw new ForbiddenError('You do not have permission to perform this action.');
    }
    return session;
  };
}

