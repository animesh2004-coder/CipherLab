import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { healthCheck, readyCheck } from '../controllers/health.controller.js';
import { getLessonBySlug, listLessons } from '../controllers/lesson.controller.js';
import { getQuiz, submitQuizAttempt } from '../controllers/quiz.controller.js';
import { getProgress, updateLessonProgress } from '../controllers/progress.controller.js';
import { deleteAccount, exportData, getMe } from '../controllers/user.controller.js';
import { ApiCsrfResponse } from '@cipherlab/shared';

export const apiRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // --- Health & Readiness (no auth) ---
  fastify.get('/healthz', healthCheck);
  fastify.get('/readyz', readyCheck);

  // --- CSRF token endpoint ---
  fastify.get('/csrf-token', async (req): Promise<ApiCsrfResponse> => {
    return {
      csrfToken: req.session?.csrfToken || '',
    };
  });

  // --- Lessons (public, cacheable) ---
  fastify.get('/lessons', listLessons);
  fastify.get('/lessons/:slug', getLessonBySlug);

  // --- Quizzes (auth required, server-graded) ---
  fastify.get('/quizzes/:slug', getQuiz);
  fastify.post('/quizzes/:slug/attempts', submitQuizAttempt);

  // --- Student Progress & Profile (auth required, session-derived identity) ---
  fastify.get('/me', getMe);
  fastify.get('/me/progress', getProgress);
  fastify.put('/me/progress/lessons/:slug', updateLessonProgress);

  // --- Data Privacy & GDPR (auth required) ---
  fastify.get('/me/export', exportData);
  fastify.delete('/me', deleteAccount);
};

