import { FastifyReply, FastifyRequest } from 'fastify';
import { userService } from '../services/user.service.js';
import { requireAuth } from '../middleware/auth-guard.js';
import { clearSessionCookie, destroySession } from '../middleware/session.js';

export async function getMe(req: FastifyRequest, reply: FastifyReply) {
  const session = await requireAuth(req, reply);
  const profile = await userService.getProfile(session.userId);

  if (!profile) {
    reply.status(404);
    throw new Error('User profile not found.');
  }

  reply.header('Cache-Control', 'private, no-cache, no-store');
  return {
    authenticated: true,
    user: profile,
    csrfToken: session.csrfToken,
  };
}

export async function exportData(req: FastifyRequest, reply: FastifyReply) {
  const session = await requireAuth(req, reply);
  const exportPayload = await userService.exportUserData(session.userId, req.ip);

  reply.header('Cache-Control', 'private, no-cache, no-store');
  reply.header('Content-Disposition', 'attachment; filename="cipherlab-data-export.json"');

  return exportPayload;
}

export async function deleteAccount(req: FastifyRequest, reply: FastifyReply) {
  const session = await requireAuth(req, reply);

  await userService.deleteAccount(session.userId, req.ip);
  await destroySession(session.sessionId);
  clearSessionCookie(reply);

  reply.header('Cache-Control', 'private, no-cache, no-store');
  return {
    message: 'Your account and associated progress have been deleted.',
  };
}

