import { quizRepository } from '../repositories/quiz.repository.js';
import { progressRepository } from '../repositories/progress.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import {
  ApiGradedQuestionResult,
  ApiQuiz,
  ApiQuizGradeResult,
  ApiQuizSubmission,
} from '@cipherlab/shared';
import { Prisma } from '@prisma/client';

export class QuizService {
  /**
   * Retrieves quiz content for students.
   * Answer keys are strictly omitted.
   */
  async getQuizStudentSafe(slug: string): Promise<ApiQuiz | null> {
    const quiz = await quizRepository.findBySlugStudentSafe(slug);
    if (!quiz) return null;

    return {
      id: quiz.id,
      slug: quiz.slug,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      totalQuestions: quiz.questions.length,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        sortOrder: q.sortOrder,
        options: q.options.map((opt) => ({
          id: opt.id,
          optionText: opt.optionText,
          sortOrder: opt.sortOrder,
        })),
      })),
    };
  }

  /**
   * Server-side grading in an atomic transaction.
   * Handles idempotency keys so network retries never duplicate submissions.
   */
  async gradeQuiz(
    userId: string,
    slug: string,
    submission: ApiQuizSubmission,
    ipAddress?: string
  ): Promise<ApiQuizGradeResult> {
    // 1. Idempotency Check
    const cached = await progressRepository.findIdempotencyKey(submission.idempotencyKey, userId);
    if (cached && cached.response) {
      return cached.response as unknown as ApiQuizGradeResult;
    }

    // 2. Fetch Quiz with internal answer keys
    const quiz = await quizRepository.findBySlugWithAnswers(slug);
    if (!quiz) {
      throw new Error(`Quiz with slug "${slug}" not found.`);
    }

    // 3. Grade answers
    let score = 0;
    const gradedQuestions: ApiGradedQuestionResult[] = [];

    for (const question of quiz.questions) {
      const selectedOptionId = submission.answers[question.id] || '';
      const correctOption = question.options.find((o) => o.isCorrect);
      const selectedOption = question.options.find((o) => o.id === selectedOptionId);

      const isCorrect = Boolean(selectedOption && selectedOption.isCorrect);
      if (isCorrect) {
        score++;
      }

      gradedQuestions.push({
        questionId: question.id,
        questionText: question.questionText,
        selectedOptionId,
        correctOptionId: correctOption ? correctOption.id : '',
        isCorrect,
        explanation: question.explanation,
      });
    }

    const totalQuestions = quiz.questions.length;
    const passed = score >= quiz.passingScore;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const submittedAt = new Date().toISOString();

    const resultPayload: ApiQuizGradeResult = {
      attemptId: '', // populated below
      quizId: quiz.id,
      quizSlug: quiz.slug,
      score,
      totalQuestions,
      passed,
      percentage,
      questions: gradedQuestions,
      submittedAt,
    };

    // 4. Save Attempt and Idempotency key atomically
    const savedAttempt = await progressRepository.saveIdempotentQuizAttempt({
      userId,
      quizId: quiz.id,
      score,
      totalQuestions,
      passed,
      answers: submission.answers as unknown as Prisma.InputJsonValue,
      gradedAnswers: gradedQuestions as unknown as Prisma.InputJsonValue,
      idempotencyKey: submission.idempotencyKey,
      responsePayload: resultPayload as unknown as Prisma.InputJsonValue,
    });

    resultPayload.attemptId = savedAttempt.id;

    // 5. Audit Log
    await auditRepository.create({
      userId,
      action: 'QUIZ_SUBMITTED',
      resourceType: 'quiz',
      resourceId: quiz.id,
      metadata: { score, totalQuestions, passed, attemptId: savedAttempt.id },
      ipAddress,
    });

    return resultPayload;
  }
}

export const quizService = new QuizService();

