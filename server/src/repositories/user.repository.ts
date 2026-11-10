import { prisma } from '../database/prisma.js';
import { User, UserRole } from '@prisma/client';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByExternalId(externalId: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { externalId, deletedAt: null },
    });
  }

  async upsertFromOidc(data: {
    externalId: string;
    email?: string | null;
    displayName: string;
    role?: UserRole;
  }): Promise<User> {
    return prisma.user.upsert({
      where: { externalId: data.externalId },
      create: {
        externalId: data.externalId,
        email: data.email || null,
        displayName: data.displayName,
        role: data.role || UserRole.STUDENT,
      },
      update: {
        email: data.email || null,
        displayName: data.displayName,
        deletedAt: null, // Reactivate if was soft-deleted
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getExportData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        createdAt: true,
        lessonProgress: {
          select: {
            completed: true,
            completedAt: true,
            lesson: {
              select: { slug: true, title: true },
            },
          },
        },
        quizAttempts: {
          select: {
            id: true,
            score: true,
            totalQuestions: true,
            passed: true,
            createdAt: true,
            quiz: {
              select: { slug: true, title: true },
            },
          },
        },
      },
    });

    return user;
  }
}

export const userRepository = new UserRepository();

