import { FastifyReply, FastifyRequest } from 'fastify';
import { lessonService } from '../services/lesson.service.js';
import { paginationSchema, slugParamSchema } from '../types/validation.js';

export async function listLessons(req: FastifyRequest, reply: FastifyReply) {
  const query = paginationSchema.parse(req.query);
  const result = await lessonService.listLessons(query.page, query.limit);

  // Set safe cache headers and ETag for public lessons
  const etag = lessonService.generateETag(result);
  reply.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  reply.header('ETag', etag);

  if (req.headers['if-none-match'] === etag) {
    reply.status(304).send();
    return;
  }

  return result;
}

export async function getLessonBySlug(req: FastifyRequest, reply: FastifyReply) {
  const params = slugParamSchema.parse(req.params);
  const lesson = await lessonService.getLessonBySlug(params.slug);

  if (!lesson) {
    reply.status(404);
    throw new Error(`Lesson "${params.slug}" not found.`);
  }

  const etag = lessonService.generateETag(lesson);
  reply.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  reply.header('ETag', etag);

  if (req.headers['if-none-match'] === etag) {
    reply.status(304).send();
    return;
  }

  return lesson;
}

