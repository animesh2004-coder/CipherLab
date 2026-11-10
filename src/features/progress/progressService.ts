import { INITIAL_PROGRESS, type StudentProgress } from './types.ts';

const STORAGE_KEY = 'cipherlab_student_progress_v1';

/**
 * Service boundary for saving and loading learning progress.
 * STRICT SECURITY: Only stores lesson completion flags and quiz scores.
 * Absolutely NO cryptographic keys, plaintext, or ciphertext are ever persisted.
 */
export function loadProgress(): StudentProgress {
  if (typeof window === 'undefined' || !window.localStorage) {
    return INITIAL_PROGRESS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
      quizAnswers: typeof parsed.quizAnswers === 'object' && parsed.quizAnswers !== null ? parsed.quizAnswers : {},
      quizCompleted: Boolean(parsed.quizCompleted),
      quizScore: typeof parsed.quizScore === 'number' ? parsed.quizScore : 0,
      quizTotal: typeof parsed.quizTotal === 'number' ? parsed.quizTotal : 5,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Failed to load progress from localStorage:', err);
    return INITIAL_PROGRESS;
  }
}

export function saveProgress(progress: StudentProgress): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const cleanProgress: StudentProgress = {
      completedLessonIds: progress.completedLessonIds,
      quizAnswers: progress.quizAnswers,
      quizCompleted: progress.quizCompleted,
      quizScore: progress.quizScore,
      quizTotal: progress.quizTotal,
      lastUpdated: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanProgress));
  } catch (err) {
    console.warn('Failed to save progress to localStorage:', err);
  }
}

export function toggleLessonCompleted(lessonId: string): StudentProgress {
  const current = loadProgress();
  const exists = current.completedLessonIds.includes(lessonId);
  const updatedIds = exists
    ? current.completedLessonIds.filter((id) => id !== lessonId)
    : [...current.completedLessonIds, lessonId];

  const updated: StudentProgress = {
    ...current,
    completedLessonIds: updatedIds,
  };
  saveProgress(updated);
  return updated;
}

export function recordQuizSubmission(answers: Record<string, number>, score: number, total: number): StudentProgress {
  const current = loadProgress();
  const updated: StudentProgress = {
    ...current,
    quizAnswers: answers,
    quizCompleted: true,
    quizScore: Math.max(score, current.quizScore),
    quizTotal: total,
  };
  saveProgress(updated);
  return updated;
}

export function resetProgress(): StudentProgress {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return INITIAL_PROGRESS;
}
