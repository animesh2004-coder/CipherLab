import assert from 'node:assert';
import test from 'node:test';

// Setup browser globals for Node test environment
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

// Intercept fetch requests to audit network calls
const networkAuditLog: { url: string; method: string; body?: string; headers: Record<string, string> }[] = [];

(globalThis as unknown as { fetch: unknown }).fetch = async (url: string | URL, init?: RequestInit) => {
  const urlStr = url.toString();
  const method = (init?.method || 'GET').toUpperCase();
  const headers = (init?.headers as Record<string, string>) || {};
  const body = init?.body ? String(init.body) : undefined;

  networkAuditLog.push({ url: urlStr, method, body, headers });

  // Simulate endpoints
  if (urlStr === '/auth/session') {
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        authenticated: true,
        user: { id: 'usr-test-1', displayName: 'Test Student', role: 'STUDENT', createdAt: new Date().toISOString() },
        csrfToken: 'csrf-secret-123',
      }),
    };
  }

  if (urlStr.startsWith('/api/v1/lessons')) {
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        data: [
          {
            id: 'symmetric-encryption',
            slug: 'symmetric-encryption',
            title: '1. What is Symmetric Encryption?',
            shortSummary: 'Test summary',
            readTime: '3 min read',
            category: 'fundamentals',
            sortOrder: 1,
            sections: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }),
    };
  }

  if (urlStr === '/api/v1/me/progress') {
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        userId: 'usr-test-1',
        completedLessonSlugs: ['symmetric-encryption'],
        lessons: [{ lessonSlug: 'symmetric-encryption', completed: true }],
        quizzes: [{ quizSlug: 'symmetric-encryption-fundamentals', bestScore: 5, totalQuestions: 5, passed: true, attemptsCount: 1 }],
        overallPercentage: 100,
        lastActiveAt: new Date().toISOString(),
      }),
    };
  }

  if (urlStr.startsWith('/api/v1/me/progress/lessons/')) {
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        userId: 'usr-test-1',
        completedLessonSlugs: ['symmetric-encryption'],
        lessons: [],
        quizzes: [],
        overallPercentage: 20,
        lastActiveAt: new Date().toISOString(),
      }),
    };
  }

  if (urlStr === '/api/v1/quizzes/symmetric-encryption-fundamentals/attempts') {
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        attemptId: 'att-123',
        quizId: 'quiz-123',
        quizSlug: 'symmetric-encryption-fundamentals',
        score: 5,
        totalQuestions: 5,
        passed: true,
        percentage: 100,
        questions: [],
        submittedAt: new Date().toISOString(),
      }),
    };
  }

  return {
    ok: false,
    status: 404,
    headers: { get: () => 'application/json' },
    json: async () => ({ error: { message: 'Not found' } }),
  };
};

import { apiService } from '../src/services/apiService.ts';

test('Security Boundary: No cryptographic material ever transmitted in API requests', async () => {
  networkAuditLog.length = 0;

  // 1. Session check
  const session = await apiService.getSession();
  assert.strictEqual(session.authenticated, true);
  assert.strictEqual(apiService.getCsrfToken(), 'csrf-secret-123');

  // 2. Lesson progress update
  await apiService.updateLessonProgress('symmetric-encryption');

  // 3. Quiz attempt submission
  await apiService.submitQuizAttempt('symmetric-encryption-fundamentals', {
    'q-1': 'opt-1',
    'q-2': 'opt-2',
  });

  // Verify all network requests
  assert.ok(networkAuditLog.length >= 3, 'Should have made network calls');

  const FORBIDDEN_WORDS = [
    'plaintext',
    'ciphertext',
    'authTag',
    'secretKey',
    'keyHex',
    'cipherPackage',
    'aes-256-gcm',
    'AesGcmPackage',
  ];

  for (const entry of networkAuditLog) {
    // Assert mutation methods include x-csrf-token
    if (['POST', 'PUT', 'DELETE'].includes(entry.method)) {
      assert.strictEqual(
        entry.headers['x-csrf-token'],
        'csrf-secret-123',
        `Mutation request to ${entry.url} must include x-csrf-token header`
      );
    }

    // Assert body contains no cryptographic material
    if (entry.body) {
      const lowerBody = entry.body.toLowerCase();
      for (const word of FORBIDDEN_WORDS) {
        assert.strictEqual(
          lowerBody.includes(word.toLowerCase()),
          false,
          `Network payload to ${entry.url} contains forbidden crypto key/data term: ${word}`
        );
      }
    }
  }
});

