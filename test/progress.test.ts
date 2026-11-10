import assert from 'node:assert';
import test from 'node:test';

// Mock localStorage for Node test environment
const mockStorage: Record<string, string> = {};
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = val;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
  },
};

import {
  loadProgress,
  saveProgress,
  toggleLessonCompleted,
  recordQuizSubmission,
  resetProgress,
} from '../src/features/progress/progressService.ts';

test('Progress Service: load initial state', () => {
  resetProgress();
  const progress = loadProgress();
  assert.deepStrictEqual(progress.completedLessonIds, []);
  assert.strictEqual(progress.quizCompleted, false);
  assert.strictEqual(progress.quizScore, 0);
});

test('Progress Service: toggle lessons', () => {
  const p1 = toggleLessonCompleted('symmetric-encryption');
  assert.deepStrictEqual(p1.completedLessonIds, ['symmetric-encryption']);

  const p2 = toggleLessonCompleted('cipher-categories');
  assert.deepStrictEqual(p2.completedLessonIds, ['symmetric-encryption', 'cipher-categories']);

  // Toggle off
  const p3 = toggleLessonCompleted('symmetric-encryption');
  assert.deepStrictEqual(p3.completedLessonIds, ['cipher-categories']);
});

test('Progress Service: submit quiz', () => {
  const answers = { q1: 1, q2: 2, q3: 1, q4: 1, q5: 1 };
  const p = recordQuizSubmission(answers, 5, 5);
  assert.strictEqual(p.quizCompleted, true);
  assert.strictEqual(p.quizScore, 5);
  assert.strictEqual(p.quizTotal, 5);

  // Check persistence
  const reloaded = loadProgress();
  assert.strictEqual(reloaded.quizCompleted, true);
  assert.strictEqual(reloaded.quizScore, 5);
  assert.deepStrictEqual(reloaded.quizAnswers, answers);
});

test('Progress Service: security check - no keys or cipher data persisted', () => {
  const rawJson = mockStorage['cipherlab_student_progress_v1'];
  assert.ok(rawJson);
  const parsed = JSON.parse(rawJson);
  assert.strictEqual('key' in parsed, false);
  assert.strictEqual('keyHex' in parsed, false);
  assert.strictEqual('plaintext' in parsed, false);
  assert.strictEqual('ciphertext' in parsed, false);
});

