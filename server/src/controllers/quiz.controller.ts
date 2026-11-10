import { FastifyReply, FastifyRequest } from 'fastify';
import { quizService } from '../services/quiz.service.js';
import { quizSubmissionSchema, slugParamSchema } from '../types/validation.js';
import { requireAuth } from '../middleware/auth-guard.js';

export async function getQuiz(req: FastifyRequest, reply: FastifyReply) {
  // Requires authentication
  await requireAuth(req, reply);

  const params = slugParamSchema.parse(req.params);
  const quiz = await quizService.getQuizStudentSafe(params.slug);

  if (!quiz) {
    reply.status(404);
    throw new Error(`Quiz "${params.slug}" not found.`);
  }

  reply.header('Cache-Control', 'private, no-cache, no-store');
  return quiz;
}

export async function submitQuizAttempt(req: FastifyRequest, reply: FastifyReply) {
  const session = await requireAuth(req, reply);

  const params = slugParamSchema.parse(req.params);
  const body = quizSubmissionSchema.parse(req.body);

  const gradeResult = await quizService.gradeQuiz(
    session.userId,
    params.slug,
    body,
    req.ip
  );

  reply.header('Cache-Control', 'private, no-cache, no-store');
  return gradeResult;
}

