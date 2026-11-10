import { progressRepository } from '../repositories/progress.repository.js';
import { lessonRepository } from '../repositories/lesson.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { ApiLessonProgressItem, ApiQuizProgressItem, ApiStudentProgress } from '@cipherlab/shared';

export class ProgressService {
  async getStudentProgress(userId: string): Promise<ApiStudentProgress> {
    const [lessonRecords, quizRecords, allLessons] = await Promise.all([
      progressRepository.getLessonProgressByUser(userId),
      progressRepository.getQuizAttemptsByUser(userId),
      lessonRepository.listPublished(1, 100),
    ]);

    // Map lesson progress
    const lessons: ApiLessonProgressItem[] = lessonRecords.map((r) => ({
      lessonSlug: r.lesson.slug,
      completed: r.completed,
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    }));

    const completedLessonSlugs = lessonRecords
      .filter((r) => r.completed)
      .map((r) => r.lesson.slug);

    // Map quiz progress (group by quiz)
    const quizMap = new Map<string, { attempts: number; bestScore: number; total: number; passed: boolean; last: string }>();

    for (const attempt of quizRecords) {
      const slug = attempt.quiz.slug;
      const existing = quizMap.get(slug) || {
        attempts: 0,
        bestScore: 0,
        total: attempt.totalQuestions,
        passed: false,
        last: attempt.createdAt.toISOString(),
      };

      existing.attempts++;
      if (attempt.score > existing.bestScore) {
        existing.bestScore = attempt.score;
        existing.passed = attempt.passed;
      }

      quizMap.set(slug, existing);
    }

    const quizzes: ApiQuizProgressItem[] = Array.from(quizMap.entries()).map(([quizSlug, data]) => ({
      quizSlug,
      bestScore: data.bestScore,
      totalQuestions: data.total,
      passed: data.passed,
      attemptsCount: data.attempts,
      lastAttemptAt: data.last,
    }));

    // Calculate overall percentage
    // Total milestones = total published lessons + 1 (quiz)
    const totalMilestones = allLessons.total + 1;
    const completedMilestones =
      completedLessonSlugs.length + (quizzes.some((q) => q.passed) ? 1 : 0);
    const overallPercentage =
      totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    return {
      userId,
      completedLessonSlugs,
      lessons,
      quizzes,
      overallPercentage,
      lastActiveAt: new Date().toISOString(),
    };
  }

  async updateLessonProgress(
    userId: string,
    lessonSlug: string,
    completed: boolean,
    ipAddress?: string
  ): Promise<ApiStudentProgress> {
    const lesson = await lessonRepository.findBySlug(lessonSlug);
    if (!lesson) {
      throw new Error(`Lesson with slug "${lessonSlug}" not found.`);
    }

    await progressRepository.upsertLessonProgress(userId, lesson.id, completed);

    await auditRepository.create({
      userId,
      action: completed ? 'LESSON_COMPLETED' : 'LESSON_UNCOMPLETED',
      resourceType: 'lesson',
      resourceId: lesson.id,
      metadata: { lessonSlug, completed },
      ipAddress,
    });

    return this.getStudentProgress(userId);
  }
}

export const progressService = new ProgressService();

