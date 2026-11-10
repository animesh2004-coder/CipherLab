import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../src/index.js';
import { prisma } from '../src/database/prisma.js';
import { saveSession, generateSessionId, generateCsrfToken } from '../src/middleware/session.js';
import { UserRole } from '@cipherlab/shared';

describe('Authorization & Student Privacy Boundaries', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  const studentAId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const studentBId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const sessionAId = generateSessionId();
  const csrfTokenA = generateCsrfToken();

  const sessionBId = generateSessionId();
  const csrfTokenB = generateCsrfToken();

  beforeEach(async () => {
    app = await buildApp();

    // Session for Student A
    await saveSession({
      sessionId: sessionAId,
      userId: studentAId,
      role: 'STUDENT' as UserRole,
      externalId: 'student-a',
      displayName: 'Student Alice',
      csrfToken: csrfTokenA,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    });

    // Session for Student B
    await saveSession({
      sessionId: sessionBId,
      userId: studentBId,
      role: 'STUDENT' as UserRole,
      externalId: 'student-b',
      displayName: 'Student Bob',
      csrfToken: csrfTokenB,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    });
  });

  it('DENIES access to protected routes when unauthenticated (401)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('PROVES user identity is derived from session: Student A cannot fetch Student B progress', async () => {
    // When Student A calls /api/v1/me/progress, prisma is queried with Student A's session ID
    const findManyMock = vi.spyOn(prisma.lessonProgress, 'findMany').mockResolvedValueOnce([
      {
        id: 'prog-1',
        userId: studentAId,
        lessonId: 'less-1',
        completed: true,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        lesson: { slug: 'symmetric-encryption', title: 'Symmetric Encryption' },
      },
    ] as any);

    vi.spyOn(prisma.quizAttempt, 'findMany').mockResolvedValueOnce([]);
    vi.spyOn(prisma.lesson, 'findMany').mockResolvedValueOnce([]);
    vi.spyOn(prisma.lesson, 'count').mockResolvedValueOnce(6);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/progress',
      headers: {
        cookie: `cipherlab_sid=${sessionAId}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);

    // Verify the query strictly used Student A's userId from the server session
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: studentAId },
      })
    );
    expect(body.userId).toBe(studentAId);
  });

  it('REJECTS state-changing request if CSRF token is missing or mismatched (403)', async () => {
    const resMissingCsrf = await app.inject({
      method: 'PUT',
      url: '/api/v1/me/progress/lessons/symmetric-encryption',
      headers: {
        cookie: `cipherlab_sid=${sessionAId}`,
      },
      payload: { completed: true },
    });

    expect(resMissingCsrf.statusCode).toBe(403);
    const body = JSON.parse(resMissingCsrf.body);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toContain('CSRF');

    // Mismatched token
    const resWrongCsrf = await app.inject({
      method: 'PUT',
      url: '/api/v1/me/progress/lessons/symmetric-encryption',
      headers: {
        cookie: `cipherlab_sid=${sessionAId}`,
        'x-csrf-token': 'wrong-token-value',
      },
      payload: { completed: true },
    });

    expect(resWrongCsrf.statusCode).toBe(403);
  });

  it('REJECTS state-changing request from unauthorized origins (403)', async () => {
    const resBadOrigin = await app.inject({
      method: 'PUT',
      url: '/api/v1/me/progress/lessons/symmetric-encryption',
      headers: {
        cookie: `cipherlab_sid=${sessionAId}`,
        'x-csrf-token': csrfTokenA,
        origin: 'https://malicious-attacker.com',
      },
      payload: { completed: true },
    });

    expect(resBadOrigin.statusCode).toBe(403);
  });
});

