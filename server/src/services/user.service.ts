import { userRepository } from '../repositories/user.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { ApiUser, ApiUserDataExport, UserRole } from '@cipherlab/shared';

export class UserService {
  async getProfile(userId: string): Promise<ApiUser | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;

    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role as UserRole,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async exportUserData(userId: string, ipAddress?: string): Promise<ApiUserDataExport> {
    const exportData = await userRepository.getExportData(userId);
    if (!exportData) {
      throw new Error('User not found.');
    }

    await auditRepository.create({
      userId,
      action: 'DATA_EXPORT_REQUESTED',
      resourceType: 'user',
      resourceId: userId,
      ipAddress,
    });

    return {
      exportDate: new Date().toISOString(),
      user: {
        id: exportData.id,
        displayName: exportData.displayName,
        email: exportData.email,
        role: exportData.role as UserRole,
        createdAt: exportData.createdAt.toISOString(),
      },
      progress: {
        lessons: exportData.lessonProgress.map((lp) => ({
          lessonSlug: lp.lesson.slug,
          lessonTitle: lp.lesson.title,
          completed: lp.completed,
          completedAt: lp.completedAt ? lp.completedAt.toISOString() : null,
        })),
        quizAttempts: exportData.quizAttempts.map((qa) => ({
          attemptId: qa.id,
          quizSlug: qa.quiz.slug,
          score: qa.score,
          totalQuestions: qa.totalQuestions,
          passed: qa.passed,
          submittedAt: qa.createdAt.toISOString(),
        })),
      },
    };
  }

  async deleteAccount(userId: string, ipAddress?: string): Promise<void> {
    await userRepository.softDelete(userId);

    await auditRepository.create({
      userId,
      action: 'ACCOUNT_DELETED',
      resourceType: 'user',
      resourceId: userId,
      ipAddress,
    });
  }
}

export const userService = new UserService();

