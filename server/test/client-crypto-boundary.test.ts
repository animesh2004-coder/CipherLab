import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/index.js';
import fs from 'node:fs';
import path from 'node:path';

describe('Strict Client-Side Encryption Boundary Verification', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp();
  });

  it('PROVES no encryption or decryption endpoints exist on the server (404)', async () => {
    const forbiddenEndpoints = [
      { method: 'POST' as const, url: '/api/v1/encrypt' },
      { method: 'POST' as const, url: '/api/v1/decrypt' },
      { method: 'POST' as const, url: '/api/encrypt' },
      { method: 'POST' as const, url: '/api/decrypt' },
      { method: 'POST' as const, url: '/api/v1/keys' },
      { method: 'GET' as const, url: '/api/v1/keys' },
      { method: 'POST' as const, url: '/api/v1/lab' },
    ];

    for (const ep of forbiddenEndpoints) {
      const res = await app.inject({
        method: ep.method,
        url: ep.url,
      });

      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('NOT_FOUND');
    }
  });

  it('VERIFIES database schema contains NO tables or columns for plaintext, keys, or ciphertext', () => {
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Forbidden column names and table names
    const forbiddenTerms = [
      'plaintext',
      'ciphertext',
      'encryptionKey',
      'secretKey',
      'ivNonce',
      'authTag',
      'labPackage',
      'cipherPackage',
    ];

    for (const term of forbiddenTerms) {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      expect(schemaContent).not.toMatch(regex);
    }
  });

  it('VERIFIES security headers are present on all API responses', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/healthz',
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });
});

