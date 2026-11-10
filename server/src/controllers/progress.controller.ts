import { FastifyReply, FastifyRequest } from 'fastify';
import { progressService } from '../services/progress.service.js';
import { lessonProgressUpdateSchema, slugParamSchema } from '../types/validation.js';
import { requireAuth } from '../middleware/auth-guard.js';

export async function getProgress(req: FastifyRequest, reply: FastifyReply) {
  const session = await requireAuth(req, reply);

  const progress = await progressService.getStudentProgress(session.userId);

  reply.header('Cache-Control', 'private, no-cache, no-store');
  return progress;
}

export async function updateLessonProgress(req: FastifyRequest, reply: FastifyReply) {
  const session = await requireAuth(req, reply);

  const params = slugParamSchema.parse(req.params);
  const body = lessonProgressUpdateSchema.parse(req.body);

  const updatedProgress = await progressService.updateLessonProgress(
    session.userId,
    params.slug,
    body.completed,
    req.ip
  );

  reply.header('Cache-Control', 'private, no-cache, no-store');
  return updatedProgress;
}

