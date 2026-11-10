import { lessonRepository } from '../repositories/lesson.repository.js';
import { ApiLesson, ApiLessonSection, PaginatedResponse } from '@cipherlab/shared';
import crypto from 'node:crypto';

export class LessonService {
  async listLessons(page: number, limit: number): Promise<PaginatedResponse<ApiLesson>> {
    const { lessons, total } = await lessonRepository.listPublished(page, limit);

    const formatted: ApiLesson[] = lessons.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      shortSummary: l.shortSummary,
      readTime: l.readTime,
      category: l.category as ApiLesson['category'],
      sortOrder: l.sortOrder,
      sections: l.content as unknown as ApiLessonSection[],
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));

    return {
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getLessonBySlug(slug: string): Promise<ApiLesson | null> {
    const lesson = await lessonRepository.findBySlug(slug);
    if (!lesson) return null;

    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      shortSummary: lesson.shortSummary,
      readTime: lesson.readTime,
      category: lesson.category as ApiLesson['category'],
      sortOrder: lesson.sortOrder,
      sections: lesson.content as unknown as ApiLessonSection[],
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
    };
  }

  generateETag(payload: unknown): string {
    const hash = crypto.createHash('md5').update(JSON.stringify(payload)).digest('hex');
    return `"${hash}"`;
  }
}

export const lessonService = new LessonService();

