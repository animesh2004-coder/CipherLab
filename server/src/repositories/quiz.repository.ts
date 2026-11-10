import { prisma } from '../database/prisma.js';

export class QuizRepository {
  /**
   * Retrieves a quiz for student viewing.
   * STRICT SECURITY: Deliberately omits `isCorrect` from options so answer keys
   * are NEVER exposed to the student before submission.
   */
  async findBySlugStudentSafe(slug: string) {
    return prisma.quiz.findUnique({
      where: { slug, isPublished: true },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        passingScore: true,
        questions: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            questionText: true,
            sortOrder: true,
            options: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                optionText: true,
                sortOrder: true,
                // NOTE: `isCorrect` is NOT selected!
              },
            },
          },
        },
      },
    });
  }

  /**
   * Server-only method for grading quiz submissions.
   * Includes `isCorrect` and `explanation`.
   */
  async findBySlugWithAnswers(slug: string) {
    return prisma.quiz.findUnique({
      where: { slug, isPublished: true },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
  }
}

export const quizRepository = new QuizRepository();

