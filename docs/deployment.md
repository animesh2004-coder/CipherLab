# CipherLab Production Deployment Guide

This document details the production architecture, capacity verification, environment setup, external prerequisites checklist, and step-by-step deployment instructions for launching **CipherLab**.

---

## 1. Production Target & Capacity Verification Audit

CipherLab is architected for an initial student launch capacity target of:
- Up to 1,000 concurrent active students.
- Sustained normal traffic of 100 API requests per second.
- Short classroom-start spikes of up to 250 API requests per second.

### Capacity Audit Status:

| Metric | Target Specification | Current Test Implementation | Audit Verification Status |
| :--- | :--- | :--- | :--- |
| **Concurrent Active Students** | Up to 1,000 active students | Session structures and schema designed; not benchmarked against live Redis cluster | ⚠️ **UNVERIFIED** (Requires live staging Redis + DB cluster) |
| **Sustained Normal Traffic** | 100 API req/s sustained | `load.test.ts` ran in-process `app.inject` against `/api/v1/healthz` with in-memory session Map | ⚠️ **UNVERIFIED** (Sequential in-memory requests do not measure concurrent DB/Redis load) |
| **Classroom-Start Burst** | 250 API req/s burst | 250 in-process `app.inject` calls against `/api/v1/healthz` completed in 68ms | ⚠️ **UNVERIFIED** (Proves Fastify router throughput only; does not test live network or DB) |
| **Horizontal Scalability** | Multi-instance stateless | Stateless architecture with Redis sessions implemented in code | ⚠️ **UNVERIFIED** (Requires multi-pod orchestration) |
| **Answer Secrecy** | 100% server-only answers | Verified: `isCorrect` and `correctIndex` stripped from API responses | ✅ **VERIFIED** (Unit/Mock level) |
| **Client-Side Crypto Isolation** | 0 cryptographic data to server | Verified: 404 on crypto routes; 0 crypto fields in DB schema; network audit clean | ✅ **VERIFIED END-TO-END** |

### Staging Environment Requirements for Real Capacity Verification:
To legitimately verify and measure launch capacity without risking live services:
1. **Isolated Staging Infrastructure**: Provision a PostgreSQL 16 database and Redis 7 instance matching production specifications.
2. **Schema & Seed**: Apply `prisma migrate deploy` and `tsx prisma/seed.ts`.
3. **Standalone API Service**: Run the Fastify server as an independent network daemon outside the test process.
4. **Networked Load Generator**: Execute a realistic load runner (e.g. k6) from a separate client machine sending HTTP traffic over TCP with concurrent virtual users exercising mixed endpoints:
   - 60% `GET /api/v1/lessons` and `/api/v1/lessons/:slug`
   - 20% `GET /api/v1/me/progress`
   - 10% `GET /api/v1/quizzes/symmetric-encryption-fundamentals`
   - 10% `POST /api/v1/quizzes/symmetric-encryption-fundamentals/attempts`
5. **Reported Metrics**: Measure real p50, p95, p99 latencies, connection pool exhaustion, Redis memory, and error rates over a 10-minute sustained duration. Do not claim capacity that has not been benchmarked under these conditions.

---

## 2. Architecture & Component Topology

```text
Student Browser (React SPA)
    │
    ├── CDN / WAF (Cloudflare / CloudFront)
    │      └── Static Assets (index.html, JS chunks, CSS, icons)
    │
    └── Same-Origin Reverse Proxy (Nginx / Cloud Load Balancer)
            │
            ├── /auth/*  ──► Stateless Node 22 / Fastify API Pods
            └── /api/*   ──► Stateless Node 22 / Fastify API Pods
                                  │
                                  ├── Managed PostgreSQL 16 (Users, Lessons, Quizzes, Progress, Audits)
                                  ├── Managed Redis 7 (Sessions, Distributed Rate Limiting, Cache)
                                  └── External OIDC Provider (OAuth 2.0 PKCE School Identity Provider)
```

### Key Architectural Boundaries
1. **Client-Side AES-GCM Lab**: All encryption, key generation, IV generation, ciphertext generation, and decryption happen strictly in the student's browser via the Web Crypto API. No crypto endpoints exist on the server.
2. **Server-Side Quiz Grading**: Answer keys are never distributed to students. Students submit their answers with a unique idempotency key; Fastify grades them atomically in PostgreSQL and records the attempt.
3. **Stateless Node 22 API**: API instances store zero in-memory user sessions. All sessions reside in Redis as opaque 256-bit keys with secure, HttpOnly, SameSite cookies. Any API instance can handle any student request.

---

## 3. Checklist of External Setup & Production Credentials

Before launching to a public production environment, ensure the following cloud resources and credentials have been provisioned:

### 3.1 Managed PostgreSQL 16
- [ ] PostgreSQL 16+ instance created (e.g., AWS RDS PostgreSQL, GCP Cloud SQL, or Supabase/Neon).
- [ ] Automated daily snapshots and point-in-time recovery (PITR) enabled.
- [ ] SSL connection enforced (`sslmode=require`).
- [ ] Database user with least privileges created.
- [ ] `DATABASE_URL` configured in secrets manager:
  ```text
  DATABASE_URL="postgresql://cipherlab_app:<PASSWORD>@<DB_HOST>:5432/cipherlab?sslmode=require&connection_limit=20"
  ```

### 3.2 Managed Redis 7
- [ ] Redis 7+ instance created (e.g., AWS ElastiCache, GCP Memorystore, or Redis Cloud).
- [ ] In-transit encryption (TLS) enabled.
- [ ] Eviction policy set to `volatile-lru` or `allkeys-lru`.
- [ ] `REDIS_URL` configured in secrets manager:
  ```text
  REDIS_URL="rediss://default:<PASSWORD>@<REDIS_HOST>:6379"
  ```

### 3.3 OpenID Connect (OIDC) Identity Provider
- [ ] Identity provider application registered (e.g., Google Workspace, Microsoft Entra ID, Okta, or Keycloak).
- [ ] Application type set to **Web Application** with **Authorization Code Flow + PKCE**.
- [ ] Redirect URI registered:
  ```text
  https://cipherlab.example.edu/auth/callback
  ```
- [ ] OIDC credentials obtained:
  - `OIDC_ISSUER_URL`: Base discovery URL (e.g., `https://accounts.google.com` or `https://login.microsoftonline.com/<TENANT_ID>/v2.0`)
  - `OIDC_CLIENT_ID`: Public client ID
  - `OIDC_CLIENT_SECRET`: Secret key for token exchange
  - `OIDC_SCOPES`: `openid profile email`

### 3.4 Platform Secrets & Domain
- [ ] High-entropy session secret generated (minimum 32 characters, recommended 64-character hex):
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Domain name registered and TLS certificate provisioned (Let's Encrypt or AWS ACM).
- [ ] CORS allowed origins set to your production domains:
  ```text
  ALLOWED_ORIGINS="https://cipherlab.example.edu"
  ```

---

## 4. Production Environment Configuration Reference

All server environment variables are validated by Zod at startup (`server/src/config/env.ts`). If any required variable is missing or invalid, the process terminates immediately with an explanatory error.

```bash
# ---------------------------------------------------------------------------
# CipherLab Server – Production Environment Variables
# ---------------------------------------------------------------------------

NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Database & Cache
DATABASE_URL=postgresql://cipherlab_app:YOUR_SECURE_PASSWORD@postgres.internal:5432/cipherlab?sslmode=require
REDIS_URL=rediss://default:YOUR_REDIS_PASSWORD@redis.internal:6379

# Session & Security
SESSION_SECRET=YOUR_64_CHAR_HEX_SESSION_SECRET_GENERATED_SECURELY
SESSION_MAX_AGE_SECONDS=86400
ALLOWED_ORIGINS=https://cipherlab.example.edu
TRUST_PROXY=true
COOKIE_DOMAIN=.example.edu

# OpenID Connect (OIDC) SSO
OIDC_ISSUER_URL=https://sso.example.edu
OIDC_CLIENT_ID=cipherlab-production-client
OIDC_CLIENT_SECRET=YOUR_OIDC_CLIENT_SECRET
OIDC_REDIRECT_URI=https://cipherlab.example.edu/auth/callback
OIDC_SCOPES=openid profile email

# Traffic Limits
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
REQUEST_BODY_LIMIT=1mb
```

---

## 5. Step-by-Step Deployment Procedure

### Step 1: Run Full Test Suite Locally or in CI/CD
```bash
# Run all unit, integration, and security tests
npm run test:all

# Verify TypeScript compilation across frontend and server
npm run typecheck
npm run typecheck:server
```

### Step 2: Build Multi-Stage Docker Image
```bash
docker build -t cipherlab-api:latest -f infra/Dockerfile .
```

### Step 3: Run Database Migrations and Seed
Before starting traffic on the new API containers, apply versioned migrations:
```bash
# In your deployment pipeline or migration init-container:
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy --schema=server/prisma/schema.prisma

# If initial setup, seed the 6 lessons and knowledge quiz:
DATABASE_URL="$DATABASE_URL" npx tsx server/prisma/seed.ts
```

### Step 4: Deploy API Containers
Deploy container instances behind your reverse proxy / load balancer.
- Set minimum replicas: 2 (for high availability during rolling restarts).
- Set horizontal autoscaling: scale up when average CPU exceeds 70% or request latency exceeds 100ms.
- Configure health check: `GET /api/v1/healthz` (interval 10s, timeout 3s).

### Step 5: Deploy Frontend Static Assets
Deploy the compiled SPA (`dist/`) to your CDN origin bucket or Nginx static root:
```bash
# Build production bundle
npm run build

# Sync assets to S3 / GCS
aws s3 sync dist/ s3://cipherlab-frontend-prod/ --delete --cache-control "public, max-age=31536000, immutable"
aws s3 cp dist/index.html s3://cipherlab-frontend-prod/index.html --cache-control "no-cache, must-revalidate"
```

### Step 6: Post-Deployment Smoke Verification
1. Access `https://cipherlab.example.edu/api/v1/readyz` and verify `{"status":"ready","checks":{"database":true,"redis":true}}`.
2. Open `https://cipherlab.example.edu` in an incognito window.
3. Test guest mode:
   - Read Lesson 1 ("What is Symmetric Encryption?").
   - Click "Mark Lesson Complete".
   - Open Encryption Lab. Encrypt plaintext, copy ciphertext package, and decrypt with the key.
4. Test authentication:
   - Click "Sign In" and authenticate via SSO.
   - Verify student name appears in the navbar.
   - Take the quiz and submit for server-side grading. Verify server grade result.
   - Test "Export My Data" (GDPR JSON download).
   - Test "Sign Out".

