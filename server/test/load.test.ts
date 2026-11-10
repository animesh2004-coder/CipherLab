import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/index.js';
import { saveSession, generateSessionId, generateCsrfToken } from '../src/middleware/session.js';
import { UserRole } from '@cipherlab/shared';

describe('Production Capacity & Load Test Suite', () => {
  it('MEASURES sustained normal traffic target: 100 req/sec over simulated student sessions', async () => {
    const app = await buildApp();

    // Pre-create 100 active student sessions
    const sessions: { id: string; csrf: string; userId: string }[] = [];
    for (let i = 0; i < 100; i++) {
      const sid = generateSessionId();
      const csrf = generateCsrfToken();
      const uid = `student-load-${i}`;
      await saveSession({
        sessionId: sid,
        userId: uid,
        role: 'STUDENT' as UserRole,
        externalId: `ext-${i}`,
        displayName: `Student ${i}`,
        csrfToken: csrf,
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
      });
      sessions.push({ id: sid, csrf, userId: uid });
    }

    // Run 500 requests (batches simulating 100+ req/s)
    const totalRequests = 500;
    const latencies: number[] = [];
    let successCount = 0;
    let errorCount = 0;

    const startTime = Date.now();

    // Process requests in concurrent batches of 50
    const batchSize = 50;
    for (let i = 0; i < totalRequests; i += batchSize) {
      const batchPromises = Array.from({ length: batchSize }).map(async (_, idx) => {
        const session = sessions[(i + idx) % sessions.length];
        const reqStart = Date.now();

        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/healthz',
          headers: {
            cookie: `cipherlab_sid=${session.id}`,
          },
        });

        const latency = Date.now() - reqStart;
        latencies.push(latency);

        if (res.statusCode === 200) {
          successCount++;
        } else {
          errorCount++;
        }
      });

      await Promise.all(batchPromises);
    }

    const durationSeconds = (Date.now() - startTime) / 1000;
    const achievedRps = Math.round(totalRequests / durationSeconds);

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    console.log('\n--- 100 req/s Sustained Load Test Results ---');
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Duration: ${durationSeconds.toFixed(2)}s`);
    console.log(`Achieved Throughput: ${achievedRps} req/s`);
    console.log(`Success: ${successCount}, Errors: ${errorCount} (Error rate: ${((errorCount / totalRequests) * 100).toFixed(2)}%)`);
    console.log(`Latency p50: ${p50}ms | p95: ${p95}ms | p99: ${p99}ms`);
    console.log('--------------------------------------------\n');

    expect(successCount).toBe(totalRequests);
    expect(errorCount).toBe(0);
    expect(p95).toBeLessThan(150); // Under 150ms p95
  });

  it('MEASURES classroom-start burst spike target: 250 req/sec concurrent burst', async () => {
    const app = await buildApp();

    const burstRequests = 250;
    const latencies: number[] = [];
    let successCount = 0;
    let errorCount = 0;

    const startTime = Date.now();

    // Fire 250 requests concurrently in a single burst
    const burstPromises = Array.from({ length: burstRequests }).map(async () => {
      const reqStart = Date.now();
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/healthz',
      });
      const latency = Date.now() - reqStart;
      latencies.push(latency);

      if (res.statusCode === 200) {
        successCount++;
      } else {
        errorCount++;
      }
    });

    await Promise.all(burstPromises);

    const durationSeconds = (Date.now() - startTime) / 1000;
    const achievedRps = Math.round(burstRequests / durationSeconds);

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    console.log('\n--- 250 req/s Classroom-Start Spike Test Results ---');
    console.log(`Spike Volume: ${burstRequests} concurrent requests`);
    console.log(`Burst Completion Time: ${durationSeconds.toFixed(2)}s`);
    console.log(`Effective Rate: ${achievedRps} req/s`);
    console.log(`Success: ${successCount}, Errors: ${errorCount}`);
    console.log(`Latency p50: ${p50}ms | p95: ${p95}ms | p99: ${p99}ms`);
    console.log('---------------------------------------------------\n');

    expect(successCount).toBe(burstRequests);
    expect(errorCount).toBe(0);
  });
});
