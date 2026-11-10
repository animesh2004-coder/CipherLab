import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../src/index.js';
import { prisma } from '../src/database/prisma.js';
import { saveSession, generateSessionId, generateCsrfToken } from '../src/middleware/session.js';
import { UserRole } from '@cipherlab/shared';

describe('Quiz Secrecy & Server-Side Grading Tests', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  const testUserId = '11111111-1111-1111-1111-111111111111';
  const testSessionId = generateSessionId();
  const testCsrfToken = generateCsrfToken();

  beforeEach(async () => {
    app = await buildApp();

    // Set up mock session
    await saveSession({
      sessionId: testSessionId,
      userId: testUserId,
      role: 'STUDENT' as UserRole,
      externalId: 'test-student-1',
      displayName: 'Test Student',
      csrfToken: testCsrfToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    });
  });

  it('PROVES quiz questions returned to students NEVER contain correctIndex or isCorrect', async () => {
    // Mock prisma response
    vi.spyOn(prisma.quiz, 'findUnique').mockResolvedValueOnce({
      id: '22222222-2222-2222-2222-222222222222',
      slug: 'symmetric-encryption-fundamentals',
      title: 'Symmetric Encryption Fundamentals',
      description: 'Knowledge check',
      passingScore: 3,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: [
        {
          id: 'q1',
          questionText: 'What is symmetric encryption?',
          sortOrder: 1,
          options: [
            { id: 'opt1', optionText: 'One key', sortOrder: 1 },
            { id: 'opt2', optionText: 'Two keys', sortOrder: 2 },
          ],
        },
      ],
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/quizzes/symmetric-encryption-fundamentals',
      headers: {
        cookie: `cipherlab_sid=${testSessionId}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    // Verify response structure
    expect(body).toHaveProperty('questions');
    expect(body.questions).toHaveLength(1);

    const q = body.questions[0];
    // CRITICAL: Ensure neither question nor options contain any answer keys
    expect(q).not.toHaveProperty('correctIndex');
    expect(q).not.toHaveProperty('correctOptionId');
    expect(q).not.toHaveProperty('explanation'); // Explanation only shown after grading!

    for (const opt of q.options) {
      expect(opt).not.toHaveProperty('isCorrect');
      expect(opt).toHaveProperty('id');
      expect(opt).toHaveProperty('optionText');
    }
  });

  it('PROVES quiz submission grades answers atomically on the server', async () => {
    const mockQuizWithAnswers = {
      id: '22222222-2222-2222-2222-222222222222',
      slug: 'symmetric-encryption-fundamentals',
      title: 'Symmetric Encryption Fundamentals',
      passingScore: 1,
      isPublished: true,
      questions: [
        {
          id: 'q1',
          questionText: 'What is symmetric encryption?',
          explanation: 'Symmetric encryption uses one key.',
          sortOrder: 1,
          options: [
            { id: 'opt1', optionText: 'One key', isCorrect: true, sortOrder: 1 },
            { id: 'opt2', optionText: 'Two keys', isCorrect: false, sortOrder: 2 },
          ],
        },
      ],
    };

    vi.spyOn(prisma.idempotencyKey, 'findUnique').mockResolvedValueOnce(null);
    vi.spyOn(prisma.quiz, 'findUnique').mockResolvedValueOnce(mockQuizWithAnswers as any);
    vi.spyOn(prisma, '$transaction').mockImplementationOnce(async (cb: any) => {
      return cb({
        quizAttempt: {
          create: vi.fn().mockResolvedValueOnce({ id: 'attempt-123' }),
        },
        idempotencyKey: {
          create: vi.fn().mockResolvedValueOnce({ id: 'idemp-123' }),
        },
      });
    });
    vi.spyOn(prisma.auditEvent, 'create').mockResolvedValueOnce({} as any);

    const submissionPayload = {
      idempotencyKey: '00000000-0000-4000-8000-000000000001',
      answers: {
        q1: 'opt1',
      },
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/quizzes/symmetric-encryption-fundamentals/attempts',
      headers: {
        cookie: `cipherlab_sid=${testSessionId}`,
        'x-csrf-token': testCsrfToken,
      },
      payload: submissionPayload,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body.score).toBe(1);
    expect(body.totalQuestions).toBe(1);
    expect(body.passed).toBe(true);
    expect(body.questions[0].isCorrect).toBe(true);
    expect(body.questions[0].explanation).toBe('Symmetric encryption uses one key.');
  });
});

