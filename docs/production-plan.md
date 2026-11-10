# CipherLab Production Implementation Plan & Audit Status

## 1. System Overview

CipherLab is a student learning application for symmetric cryptography designed for launch readiness.
- **Frontend**: React 18 / TypeScript SPA built with Vite.
- **Interactive Encryption Lab**: 100% browser-side using Web Crypto API with AES-GCM (256-bit key, 12-byte fresh IV, authenticated ciphertext packages). Cryptographic keys, plaintexts, and ciphertexts never leave the browser.
- **Backend API**: Modular monolith in Node.js 22 LTS, Fastify 5, and TypeScript.
- **Database**: PostgreSQL 16 schema managed with Prisma ORM, versioned SQL migration, and idempotent seed.
- **Cache & Sessions**: Redis 7 for opaque sessions, distributed rate limiting, and caching (with in-memory fallback for offline test suites).
- **Authentication**: OIDC Authorization Code Flow with PKCE (dev mock adapter strictly blocked in `production`).
- **Data Privacy**: Self-service user data export (`GET /api/v1/me/export`) and account deletion (`DELETE /api/v1/me`).

---

## 2. Architecture Target

```text
Student Browser (React SPA)
    │
    ├── Static assets served by CDN / Nginx (Vite bundle)
    │
    └── /api/* & /auth/* reverse proxy ──► Stateless Fastify API (Node.js 22 LTS)
                                            ├── Managed PostgreSQL 16
                                            ├── Managed Redis 7
                                            └── OIDC Identity Provider (PKCE)
```

---

## 3. Implementation Phases & Audit Verification Status

### Phase 1: Shared Contracts & Server Foundation ✅ VERIFIED
- [x] Shared TypeScript contracts in `shared/api-contracts/index.ts` (`@cipherlab/shared`).
- [x] Fastify 5 application factory (`server/src/index.ts`) with graceful shutdown and cross-platform entrypoint resolution (`pathToFileURL`).
- [x] Pino structured logger (`server/src/observability/logger.ts`) with deep redactions for secrets, cookies, tokens, and cryptographic lab terms.
- [x] Environment configuration with strict Zod validation (`server/src/config/env.ts`).
- [x] Docker Compose setup (`infra/docker-compose.yml`) for local PostgreSQL 16 and Redis 7.
- [x] Liveness (`/api/v1/healthz`) and readiness (`/api/v1/readyz`) probe endpoints.

### Phase 2: Database Schema & Prisma ⚠️ CODE COMPLETE, LIVE MIGRATION UNVERIFIED
- [x] PostgreSQL relational schema (`server/prisma/schema.prisma`) with models: `users`, `lessons`, `quizzes`, `questions`, `question_options`, `lesson_progress`, `quiz_attempts`, `audit_events`, `idempotency_keys`.
- [x] Versioned SQL migration script authored (`server/prisma/migrations/20261110000000_init/migration.sql`).
- [x] Idempotent seed script authored (`server/prisma/seed.ts`) populating all 6 curriculum lessons and 5 quiz questions.
- [x] Answer secrecy: `isCorrect` stored only on `question_options` table; strictly omitted from all student-facing endpoints.
- [x] Zero crypto fields: Schema contains no columns for keys, IVs, plaintexts, or ciphertexts.
- [!] **Audit Finding**: `prisma migrate deploy` and `seed.ts` have not executed against a live PostgreSQL host in this environment because no database instance is currently provisioned or running on port 5432.

### Phase 3: Authentication & Sessions ⚠️ CODE COMPLETE, REAL OIDC UNVERIFIED
- [x] OIDC Authorization Code Flow with PKCE implemented (`/auth/login`, `/auth/callback`).
- [x] Dev-only mock authentication adapter (`POST /auth/dev-login`) strictly guarded and blocked in production (`NODE_ENV === 'production'`).
- [x] Session management (`server/src/middleware/session.ts`) with rotation upon login, opaque session IDs, and secure cookies (`HttpOnly`, `SameSite=Lax`, `Secure` in prod).
- [x] Role-Based Access Control (`STUDENT`, `CONTENT_ADMIN`, `PLATFORM_ADMIN`).
- [x] CSRF protection (`server/src/middleware/csrf.ts`): Origin/Referer verification and double-submit `x-csrf-token` header enforcement on mutation requests.
- [!] **Audit Finding**: Real OIDC login with an external identity provider (Google, Microsoft, Okta) is UNVERIFIED due to missing live identity provider credentials. Real Redis session clustering is UNVERIFIED because tests ran against the in-memory Map fallback.

### Phase 4: API Routes & Controllers ✅ VERIFIED (Unit/In-Process Level)
- [x] Versioned REST endpoints under `/api/v1` (`server/src/routes/api.ts`).
- [x] Request validation via Zod schemas (`server/src/types/validation.ts`).
- [x] Lessons endpoints (`/api/v1/lessons`, `/api/v1/lessons/:slug`) with HTTP caching and ETags.
- [x] Atomic server-side quiz grading (`/api/v1/quizzes/:slug/attempts`) with UUID idempotency keys preventing duplicate submissions.
- [x] Progress endpoints (`/api/v1/me/progress`, `/api/v1/me/progress/lessons/:slug`) with session-derived identity.
- [x] Data privacy endpoints: User data export (`/api/v1/me/export`) and self-service account deletion (`DELETE /api/v1/me`). (Technical endpoints implemented; legal GDPR compliance is not claimed).
- [x] Standardized error envelope: `{ error: { code, message, requestId } }`.

### Phase 5: Security Hardening ✅ VERIFIED
- [x] Redis-backed rate limiting (`@fastify/rate-limit`) keyed on IP and session (in-memory fallback when Redis is offline).
- [x] Production security headers (`server/src/middleware/security-headers.ts`): CSP, HSTS, X-Content-Type-Options: nosniff, frame protection (DENY).
- [x] Strict CORS origin validation against `ALLOWED_ORIGINS`.
- [x] 1MB request body limit.
- [x] Security audit log repository (`server/src/repositories/audit.repository.ts`).

### Phase 6: Frontend Integration ✅ VERIFIED END-TO-END
- [x] `src/services/apiService.ts`: Connected to Fastify API with session check and CSRF token propagation.
- [x] Graceful guest mode & offline fallback: Students can view lessons, take local quizzes, and run the encryption lab completely offline with zero degradation.
- [x] `src/components/Navbar.tsx`: Account pill displaying signed-in student name, role, GDPR export, and sign-out menu; Sign In modal supporting OIDC SSO and one-click dev login.
- [x] `src/features/lessons/QuizView.tsx`: Integrated with server-side quiz grading (`/api/v1/quizzes/:slug/attempts`), displaying official server marks and explanations while keeping question answers secret before grading.
- [x] `src/app/App.tsx`: Handles session sync, query notifications (`?login=success`), GDPR downloads, and offline state.
- [x] Non-negotiable boundary preserved: `src/features/encryption/` operates 100% in browser Web Crypto API; 0 crypto payloads ever sent over network.

### Phase 7: Observability & Operations ⚠️ PARTIALLY VERIFIED
- [x] OpenTelemetry-compatible in-process metrics aggregator (`server/src/observability/telemetry.ts`).
- [x] Pino structured logging with request IDs (`reqId`), durations, and status codes.
- [x] Operational runbook (`docs/runbook.md`) covering DB/Redis outage, IdP outage, secret rotation, and backup/restore procedures.
- [x] Production deployment documentation (`docs/deployment.md`) with external prerequisites and step-by-step rollout guide.
- [!] **Audit Finding**: Automated backup scripts (`pg_dump` to cloud storage) are documented procedures only; no automated backup pipeline has been executed against live storage.

### Phase 8: Testing & Capacity Target ⚠️ IN-PROCESS MOCK ONLY, CAPACITY UNVERIFIED
- [x] Frontend unit and crypto pipeline tests: 13 passed, 0 failed (`npm test`).
- [x] Cryptographic boundary network interception test: Verified that no plaintext, keys, or ciphertext are sent to `/api`.
- [x] Server unit and authorization test suites: 11 passed, 0 failed (`npm run test:server`).
  - `test/quiz-secrecy.test.ts`: Proves student-facing endpoints omit `isCorrect`/`correctIndex` (mocked Prisma).
  - `test/client-crypto-boundary.test.ts`: Proves 404 on crypto endpoints, 0 crypto DB columns, security headers.
  - `test/authorization.test.ts`: Proves authentication guard, cross-student privacy, CSRF token validation (mocked Prisma).
- [!] **Audit Finding on Capacity**:
  - The stated targets (1,000 concurrent students, 100 req/s sustained traffic with database/Redis operations, 250 req/s burst) are **UNVERIFIED**.
  - `server/test/load.test.ts` was an in-process router benchmark using Fastify's `app.inject` directed strictly at `/api/v1/healthz` with in-memory session Maps.
  - Sequential batch iterations are not concurrent active users, and `/healthz` tests neither PostgreSQL queries nor Redis pooling. Real capacity testing requires an external load runner (e.g., k6) targeting a running API with live PostgreSQL and Redis.

### Phase 9: Deployment Artifacts ✅ VERIFIED
- [x] Multi-stage production Dockerfile (`infra/Dockerfile`): Corrected entrypoint to `server/dist/server/src/index.js`, Node 22 on Alpine, unprivileged non-root user `nodejs:nodejs` (UID 10001), dumb-init, curl healthcheck.
- [x] Nginx reverse proxy configuration (`infra/nginx.conf`): Same-origin routing, SSL/TLS, security headers, Gzip, and static asset caching.
- [x] Production environment documentation (`server/.env.example`).
- [x] Static build probe (`test/server-probe.mjs`): Verifies `dist/` HTML, JS, and CSS bundle presence and integrity.

---

## 4. Non-Negotiable Boundaries Audit

| Boundary Requirement | Implementation Proof | Verified |
| :--- | :--- | :--- |
| **Encryption lab is client-side only** | `src/features/encryption/` uses browser Web Crypto API only. Test `test/api-service-boundary.test.ts` audits network calls; `test/client-crypto-boundary.test.ts` confirms 404 on `/api/v1/encrypt` and zero crypto DB columns. | ✅ Verified |
| **Correct quiz answers are server-only** | `server/src/services/quiz.service.ts` omits `isCorrect` from student queries. Verified by `test/quiz-secrecy.test.ts`. | ✅ Verified (Unit level) |
| **Session-derived identity** | All progress and quiz endpoints derive `userId` from verified session; client `userId` is never trusted. Verified by `test/authorization.test.ts`. | ✅ Verified (Unit level) |
| **No custom password storage** | Delegated entirely to OIDC Authorization Code Flow with PKCE. Dev adapter is strictly blocked in production (`NODE_ENV === 'production'`). | ✅ Verified (Code level) |
| **Structured logging with redaction** | Pino logger configured in `server/src/observability/logger.ts` redacts cookies, tokens, and cryptographic terms. | ✅ Verified |
