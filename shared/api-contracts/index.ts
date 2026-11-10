/**
 * Shared API Contracts between CipherLab frontend and backend.
 *
 * NON-NEGOTIABLE SECURITY RULES:
 * 1. Correct answers for quizzes are NEVER included in student-facing types.
 * 2. Cryptographic keys, plaintexts, ciphertexts, IVs, or auth tags NEVER appear
 *    in these contracts because the encryption lab is strictly client-side.
 */

// ---------------------------------------------------------------------------
// Common & Error Types
// ---------------------------------------------------------------------------

export interface ApiError {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedRequest {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Health & Readiness
// ---------------------------------------------------------------------------

export interface ApiHealthResponse {
  status: 'ok';
  timestamp: string;
  version: string;
}

export interface ApiReadyResponse {
  status: 'ready' | 'not_ready';
  timestamp: string;
  checks: {
    database: boolean;
    redis: boolean;
  };
}

// ---------------------------------------------------------------------------
// User & Auth
// ---------------------------------------------------------------------------

export type UserRole = 'STUDENT' | 'CONTENT_ADMIN' | 'PLATFORM_ADMIN';

export interface ApiUser {
  id: string;
  displayName: string;
  email?: string | null;
  role: UserRole;
  createdAt: string;
}

export interface ApiSessionInfo {
  authenticated: boolean;
  user?: ApiUser;
  csrfToken?: string;
}

export interface ApiCsrfResponse {
  csrfToken: string;
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

export interface ApiLessonSection {
  heading: string;
  content: string;
  keyTakeaway?: string;
  callout?: {
    type: 'tip' | 'warning' | 'info';
    title: string;
    text: string;
  };
}

export interface ApiLesson {
  id: string;
  slug: string;
  title: string;
  shortSummary: string;
  readTime: string;
  category: 'fundamentals' | 'ciphers' | 'modern' | 'security';
  sortOrder: number;
  sections: ApiLessonSection[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiLessonSummary {
  id: string;
  slug: string;
  title: string;
  shortSummary: string;
  readTime: string;
  category: string;
  sortOrder: number;
}

// ---------------------------------------------------------------------------
// Quizzes & Grading (SERVER-ONLY CORRECT ANSWERS)
// ---------------------------------------------------------------------------

export interface ApiQuestionOption {
  id: string;
  optionText: string;
  sortOrder: number;
  // NOTE: isCorrect is deliberately OMITTED here! It is server-only.
}

export interface ApiQuizQuestion {
  id: string;
  questionText: string;
  sortOrder: number;
  options: ApiQuestionOption[];
}

export interface ApiQuiz {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  passingScore: number;
  totalQuestions: number;
  questions: ApiQuizQuestion[];
}

/**
 * Payload sent by student to submit a quiz attempt.
 */
export interface ApiQuizSubmission {
  idempotencyKey: string;
  // questionId -> selectedOptionId
  answers: Record<string, string>;
}

/**
 * Graded result returned by the server AFTER grading.
 * Only after grading does the server reveal explanations and correctness.
 */
export interface ApiGradedQuestionResult {
  questionId: string;
  questionText: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string;
}

export interface ApiQuizGradeResult {
  attemptId: string;
  quizId: string;
  quizSlug: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  percentage: number;
  questions: ApiGradedQuestionResult[];
  submittedAt: string;
}

// ---------------------------------------------------------------------------
// Student Progress
// ---------------------------------------------------------------------------

export interface ApiLessonProgressItem {
  lessonSlug: string;
  completed: boolean;
  completedAt?: string | null;
}

export interface ApiQuizProgressItem {
  quizSlug: string;
  bestScore: number;
  totalQuestions: number;
  passed: boolean;
  attemptsCount: number;
  lastAttemptAt?: string | null;
}

export interface ApiStudentProgress {
  userId: string;
  completedLessonSlugs: string[];
  lessons: ApiLessonProgressItem[];
  quizzes: ApiQuizProgressItem[];
  overallPercentage: number;
  lastActiveAt: string;
}

export interface ApiUpdateLessonProgressRequest {
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Account Management & Data Export / Deletion (GDPR / Privacy)
// ---------------------------------------------------------------------------

export interface ApiUserDataExport {
  exportDate: string;
  user: ApiUser;
  progress: {
    lessons: {
      lessonSlug: string;
      lessonTitle: string;
      completed: boolean;
      completedAt: string | null;
    }[];
    quizAttempts: {
      attemptId: string;
      quizSlug: string;
      score: number;
      totalQuestions: number;
      passed: boolean;
      submittedAt: string;
    }[];
  };
}

export interface ApiDeleteAccountResponse {
  message: string;
  scheduledDeletionAt?: string;
}
