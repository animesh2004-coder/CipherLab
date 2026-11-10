import { prisma } from '../database/prisma.js';
import { Prisma } from '@prisma/client';

export class ProgressRepository {
  async getLessonProgressByUser(userId: string) {
    return prisma.lessonProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: { slug: true, title: true },
        },
      },
    });
  }

  async upsertLessonProgress(userId: string, lessonId: string, completed: boolean) {
    return prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      create: {
        userId,
        lessonId,
        completed,
        completedAt: completed ? new Date() : null,
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    });
  }

  async getQuizAttemptsByUser(userId: string, quizId?: string) {
    return prisma.quizAttempt.findMany({
      where: {
        userId,
        ...(quizId ? { quizId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        quiz: {
          select: { slug: true, title: true },
        },
      },
    });
  }

  async findIdempotencyKey(key: string, userId: string) {
    const record = await prisma.idempotencyKey.findUnique({
      where: { key },
    });
    if (!record || record.userId !== userId) return null;
    if (new Date() > record.expiresAt) return null;
    return record;
  }

  async saveIdempotentQuizAttempt(
    data: {
      userId: string;
      quizId: string;
      score: number;
      totalQuestions: number;
      passed: boolean;
      answers: Prisma.InputJsonValue;
      gradedAnswers: Prisma.InputJsonValue;
      idempotencyKey: string;
      responsePayload: Prisma.InputJsonValue;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Create the quiz attempt
      const attempt = await tx.quizAttempt.create({
        data: {
          userId: data.userId,
          quizId: data.quizId,
          score: data.score,
          totalQuestions: data.totalQuestions,
          passed: data.passed,
          answers: data.answers,
          gradedAnswers: data.gradedAnswers,
          idempotencyKey: data.idempotencyKey,
        },
      });

      // 2. Save idempotency key with 24-hour expiration
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await tx.idempotencyKey.create({
        data: {
          key: data.idempotencyKey,
          userId: data.userId,
          response: data.responsePayload,
          expiresAt,
        },
      });

      return attempt;
    });
  }
}

export const progressRepository = new ProgressRepository();

