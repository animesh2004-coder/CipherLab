import { LESSONS } from '../features/lessons/lessonData.ts';
import type { Lesson } from '../features/lessons/types.ts';
import {
  loadProgress,
  recordQuizSubmission,
  resetProgress,
  saveProgress,
  toggleLessonCompleted,
} from '../features/progress/progressService.ts';
import type { StudentProgress } from '../features/progress/types.ts';
import type {
  ApiQuiz,
  ApiQuizGradeResult,
  ApiSessionInfo,
  ApiStudentProgress,
  ApiUser,
  ApiUserDataExport,
} from '../../shared/api-contracts/index.ts';

/**
 * Service boundary abstraction for CipherLab.
 * Connects to the Fastify production API when online and authenticated,
 * while maintaining graceful offline fallbacks and guest mode.
 *
 * NON-NEGOTIABLE SECURITY BOUNDARY:
 * Keys, plaintexts, IVs, nonces, ciphertexts, and auth tags NEVER touch this service boundary.
 * All cryptography remains 100% inside the browser Web Crypto API in src/features/encryption/.
 */
export interface ICipherLabApiService {
  // Session & Authentication
  getSession(): Promise<ApiSessionInfo>;
  devLogin(displayName?: string): Promise<ApiSessionInfo>;
  logout(): Promise<void>;
  getCurrentUser(): ApiUser | null;
  getCsrfToken(): string | null;

  // Curriculum & Content
  getLessons(): Promise<Lesson[]>;
  getLessonById(id: string): Promise<Lesson | null>;
  getApiQuiz(slug?: string): Promise<ApiQuiz | null>;

  // Progress & Server-Side Quiz Grading
  getProgress(): Promise<StudentProgress>;
  updateLessonProgress(lessonId: string): Promise<StudentProgress>;
  submitQuiz(answers: Record<string, number>, score: number, total: number): Promise<StudentProgress>;
  submitQuizAttempt(
    slug: string,
    answers: Record<string, string>
  ): Promise<ApiQuizGradeResult | null>;
  resetAllProgress(): Promise<StudentProgress>;

  // Privacy & GDPR
  exportUserData(): Promise<ApiUserDataExport | null>;
  deleteAccount(): Promise<boolean>;
}

class CipherLabApiService implements ICipherLabApiService {
  private currentUser: ApiUser | null = null;
  private csrfToken: string | null = null;
  private sessionInitialized = false;

  /**
   * Helper to execute API requests with credentials and CSRF tokens.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      if (this.csrfToken) {
        headers['x-csrf-token'] = this.csrfToken;
      }
      if (options.body && typeof options.body === 'string') {
        headers['Content-Type'] = 'application/json';
      }
    }

    try {
      const res = await fetch(endpoint, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (res.status === 204) {
        return { ok: true, status: 204 };
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (res.ok) {
          return { ok: true, status: res.status, data: json as T };
        }
        return {
          ok: false,
          status: res.status,
          error: json?.error?.message || `Request failed with status ${res.status}`,
        };
      }

      return {
        ok: res.ok,
        status: res.status,
        error: res.ok ? undefined : `HTTP ${res.status} ${res.statusText}`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      return { ok: false, status: 0, error: message };
    }
  }

  getCurrentUser(): ApiUser | null {
    return this.currentUser;
  }

  getCsrfToken(): string | null {
    return this.csrfToken;
  }

  /**
   * Checks the active session with the backend.
   */
  async getSession(): Promise<ApiSessionInfo> {
    const res = await this.request<ApiSessionInfo>('/auth/session');
    this.sessionInitialized = true;

    if (res.ok && res.data && res.data.authenticated) {
      this.currentUser = res.data.user || null;
      this.csrfToken = res.data.csrfToken || null;
      return res.data;
    }

    this.currentUser = null;
    this.csrfToken = null;
    return { authenticated: false };
  }

  /**
   * Fast dev-login adapter for testing and local exploration.
   */
  async devLogin(displayName = 'Student Learner'): Promise<ApiSessionInfo> {
    const res = await this.request<{
      success: boolean;
      user: ApiUser;
      csrfToken: string;
    }>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    });

    if (res.ok && res.data && res.data.user) {
      this.currentUser = res.data.user;
      this.csrfToken = res.data.csrfToken;
      return {
        authenticated: true,
        user: this.currentUser,
        csrfToken: this.csrfToken,
      };
    }

    throw new Error(res.error || 'Dev login failed.');
  }

  /**
   * Logs out the user on the server and clears session state.
   */
  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.currentUser = null;
    this.csrfToken = null;
  }

  /**
   * Fetches published lessons from the API with fallback to static content.
   */
  async getLessons(): Promise<Lesson[]> {
    const res = await this.request<{ data: Lesson[] }>('/api/v1/lessons?limit=50');
    if (res.ok && res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
      return res.data.data;
    }
    return LESSONS;
  }

  async getLessonById(id: string): Promise<Lesson | null> {
    const res = await this.request<Lesson>(`/api/v1/lessons/${id}`);
    if (res.ok && res.data) {
      return res.data;
    }
    return LESSONS.find((l) => l.id === id) || null;
  }

  /**
   * Fetches the quiz questions from the API (omitting answer keys!).
   */
  async getApiQuiz(slug = 'symmetric-encryption-fundamentals'): Promise<ApiQuiz | null> {
    const res = await this.request<ApiQuiz>(`/api/v1/quizzes/${slug}`);
    if (res.ok && res.data) {
      return res.data;
    }
    return null;
  }

  /**
   * Loads student progress. If authenticated with API, merges server state.
   */
  async getProgress(): Promise<StudentProgress> {
    if (!this.sessionInitialized) {
      await this.getSession();
    }

    if (this.currentUser) {
      const res = await this.request<ApiStudentProgress>('/api/v1/me/progress');
      if (res.ok && res.data) {
        const local = loadProgress();
        const quizItem = res.data.quizzes.find(
          (q) => q.quizSlug === 'symmetric-encryption-fundamentals'
        );

        const merged: StudentProgress = {
          completedLessonIds: res.data.completedLessonSlugs,
          quizAnswers: local.quizAnswers,
          quizCompleted: (quizItem?.attemptsCount ?? 0) > 0,
          quizScore: quizItem?.bestScore ?? local.quizScore,
          quizTotal: quizItem?.totalQuestions ?? 5,
          lastUpdated: res.data.lastActiveAt,
        };

        saveProgress(merged);
        return merged;
      }
    }

    return loadProgress();
  }

  /**
   * Toggles lesson completion on both server and client.
   */
  async updateLessonProgress(lessonId: string): Promise<StudentProgress> {
    const current = loadProgress();
    const willBeCompleted = !current.completedLessonIds.includes(lessonId);

    if (this.currentUser) {
      await this.request(`/api/v1/me/progress/lessons/${lessonId}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: willBeCompleted }),
      });
    }

    return toggleLessonCompleted(lessonId);
  }

  /**
   * Submits a quiz attempt to the server for atomic, secret grading.
   */
  async submitQuizAttempt(
    slug = 'symmetric-encryption-fundamentals',
    answers: Record<string, string>
  ): Promise<ApiQuizGradeResult | null> {
    const idempotencyKey =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const res = await this.request<ApiQuizGradeResult>(`/api/v1/quizzes/${slug}/attempts`, {
      method: 'POST',
      body: JSON.stringify({
        idempotencyKey,
        answers,
      }),
    });

    if (res.ok && res.data) {
      // Also update local storage cache for instant offline view
      const local = loadProgress();
      const updated: StudentProgress = {
        ...local,
        quizCompleted: true,
        quizScore: Math.max(res.data.score, local.quizScore),
        quizTotal: res.data.totalQuestions,
      };
      saveProgress(updated);
      return res.data;
    }

    return null;
  }

  /**
   * Local quiz submission (used in offline / guest mode).
   */
  async submitQuiz(
    answers: Record<string, number>,
    score: number,
    total: number
  ): Promise<StudentProgress> {
    const updated = recordQuizSubmission(answers, score, total);
    return updated;
  }

  /**
   * Exports student data (GDPR requirement).
   */
  async exportUserData(): Promise<ApiUserDataExport | null> {
    const res = await this.request<ApiUserDataExport>('/api/v1/me/export');
    if (res.ok && res.data) {
      return res.data;
    }
    return null;
  }

  /**
   * Deletes user account and data (GDPR requirement).
   */
  async deleteAccount(): Promise<boolean> {
    const res = await this.request('/api/v1/me', { method: 'DELETE' });
    if (res.ok) {
      this.currentUser = null;
      this.csrfToken = null;
      resetProgress();
      return true;
    }
    return false;
  }

  /**
   * Resets all progress.
   */
  async resetAllProgress(): Promise<StudentProgress> {
    return resetProgress();
  }
}

export const apiService: ICipherLabApiService = new CipherLabApiService();
