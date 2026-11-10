import { prisma } from '../database/prisma.js';
import { Lesson } from '@prisma/client';

export class LessonRepository {
  async listPublished(page: number, limit: number): Promise<{ lessons: Lesson[]; total: number }> {
    const skip = (page - 1) * limit;

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.lesson.count({ where: { isPublished: true } }),
    ]);

    return { lessons, total };
  }

  async findBySlug(slug: string): Promise<Lesson | null> {
    return prisma.lesson.findUnique({
      where: { slug, isPublished: true },
    });
  }

  async findById(id: string): Promise<Lesson | null> {
    return prisma.lesson.findUnique({
      where: { id, isPublished: true },
    });
  }
}

export const lessonRepository = new LessonRepository();

