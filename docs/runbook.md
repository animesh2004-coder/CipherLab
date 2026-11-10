# CipherLab Operations Runbook

This runbook outlines operational procedures, incident response steps, disaster recovery, secret rotation, and maintenance workflows for the production **CipherLab** learning platform.

---

## 1. System Overview & Architecture

- **Frontend**: React 18 / TypeScript SPA served via CDN/Nginx. AES-GCM encryption lab executes **100% inside student browsers via Web Crypto API**. Cryptographic material never leaves the client.
- **API**: Stateless Fastify 5 instances running Node.js 22 LTS on Alpine Linux.
- **Database**: PostgreSQL 16 managed database with Prisma ORM. Stores student accounts, lessons, quizzes, questions, options (with server-only `isCorrect`), progress, and audit logs.
- **Cache & Sessions**: Redis 7 cluster or managed instance. Stores opaque session tokens (`sess:<id>`), rate limit counters, and lesson caches.
- **Identity Provider**: OpenID Connect (OIDC) with Authorization Code + PKCE flow. Dev-login adapter is strictly blocked in production.

---

## 2. Health & Diagnostic Endpoints

The API exposes two diagnostic endpoints without requiring authentication:

| Endpoint | Purpose | Normal Response |
| :--- | :--- | :--- |
| `GET /api/v1/healthz` | Liveness check (used by load balancer & Kubernetes) | `200 OK` `{"status":"ok","timestamp":"...","version":"1.0.0"}` |
| `GET /api/v1/readyz` | Readiness check (tests PostgreSQL & Redis connectivity) | `200 OK` `{"status":"ready","checks":{"database":true,"redis":true}}` |

If a dependency fails, `/api/v1/readyz` returns `503 Service Unavailable` with details:
```json
{
  "status": "not_ready",
  "timestamp": "2026-11-10T16:00:00.000Z",
  "checks": {
    "database": false,
    "redis": true
  }
}
```

---

## 3. Incident Response Playbooks

### Incident 1: Database Outage or Connection Failure

**Symptoms**:
- `/api/v1/readyz` returns 503 (`database: false`).
- Pino logs emit `PrismaClientInitializationError` or connection timeout errors.
- Students experience 500 errors when saving lesson progress or taking quizzes.
- *Crucial note*: The client-side AES-GCM encryption lab remains fully functional offline.

**Mitigation Steps**:
1. Check database server resource utilization (CPU, memory, storage, active connection count).
   ```bash
   # Check active connections to PostgreSQL
   psql "$DATABASE_URL" -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
   ```
2. If connection pool is exhausted:
   - Verify API instances are not leaking connections. The server Prisma client is configured as a singleton with a connection pool size matched to container limits (`?connection_limit=20`).
   - If horizontal autoscaling created more API pods than the database connection limit, scale down API replicas or enable a connection pooler (e.g., PgBouncer or AWS RDS Proxy).
3. If PostgreSQL process crashed:
   - Trigger failover to the standby replica if using AWS RDS Multi-AZ or GCP Cloud SQL High Availability.
   - Update `DATABASE_URL` if not using a floating DNS endpoint.
4. Restart API instances once the database is healthy.

---

### Incident 2: Redis Outage or Session Storage Failure

**Symptoms**:
- `/api/v1/readyz` reports `redis: false`.
- Log entries report `Redis connection error: ECONNREFUSED`.
- Users report sudden logouts or authentication failures.

**Mitigation Steps**:
1. Check Redis memory usage and CPU:
   ```bash
   redis-cli -u "$REDIS_URL" info memory
   redis-cli -u "$REDIS_URL" info clients
   ```
2. If Redis memory is exhausted (`OOM`):
   - Verify `maxmemory-policy` is set to `volatile-lru` or `allkeys-lru` so expired sessions and rate limit keys are evicted before crashing.
   - Clean up orphan rate limit keys if necessary:
     ```bash
     redis-cli -u "$REDIS_URL" --scan --pattern "rl:*" | xargs -r redis-cli -u "$REDIS_URL" del
     ```
3. If using managed Redis (AWS ElastiCache / Redis Enterprise):
   - Trigger failover to replica node.
4. Note on resilience: The CipherLab API includes an automatic in-memory fallback for transient Redis disconnects in test/dev environments, but production requires a dedicated Redis instance for multi-instance session synchronization.

---

### Incident 3: OIDC / Identity Provider Outage

**Symptoms**:
- Students clicking "Sign In" receive error messages or timeout redirects from the school's SSO provider.
- Server logs show `OIDC callback processing failed: fetch failed`.

**Mitigation Steps**:
1. Check the IdP status page or test the OIDC discovery document:
   ```bash
   curl -I "$OIDC_ISSUER_URL/.well-known/openid-configuration"
   ```
2. If the IdP is down:
   - Existing active sessions stored in Redis remain valid until `expiresAt`. Students already logged in will not be disrupted.
   - Students not logged in can continue learning as **guests**:
     - All 6 interactive lessons remain scannable.
     - Block vs. Stream comparison matrix remains interactive.
     - Interactive AES-GCM Encryption Lab operates 100% locally.
     - Local progress is saved in `localStorage`.
   - Post an in-app banner notifying students that SSO login is temporarily unavailable but guest learning and encryption labs are unaffected.

---

### Incident 4: Failed Database Migration Rollback

**Symptoms**:
- `prisma migrate deploy` fails during deployment pipeline.
- Database is marked as having a failed migration.

**Mitigation Steps**:
1. Identify the failed migration:
   ```bash
   npx prisma migrate status
   ```
2. Inspect the migration error output. All CipherLab migrations are stored in `server/prisma/migrations/`.
3. If the migration failed midway:
   - Fix the underlying constraint or schema conflict.
   - Run `npx prisma migrate resolve --rolled-back <migration_name>` to mark the migration as rolled back.
   - Test the corrected SQL script on a staging database.
   - Run `npx prisma migrate deploy` once verified.

---

## 4. Secret & Credential Rotation Procedures

### 4.1 Rotating `SESSION_SECRET`
The session secret signs and encrypts cookie session IDs.
1. When rotating, existing sessions will be invalidated, requiring users to log in again. Schedule rotation during off-peak hours (e.g., Sunday 02:00 UTC).
2. Generate a fresh 64-character high-entropy secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Update the secret in your cloud secrets manager (AWS Secrets Manager, GCP Secret Manager, or HashiCorp Vault).
4. Perform a rolling restart of API instances.

### 4.2 Rotating OIDC Client Secret
1. Generate a new client secret in your OIDC provider console (e.g., Okta, Auth0, Keycloak).
2. Update `OIDC_CLIENT_SECRET` in the secrets manager.
3. Deploy new configuration. Existing student sessions will NOT be invalidated because the OIDC client secret is only used during authorization code exchange.

### 4.3 Rotating Database Password
1. In PostgreSQL, create or update the user's password:
   ```sql
   ALTER USER cipherlab_app WITH PASSWORD 'new_strong_password_here';
   ```
2. Update `DATABASE_URL` in secrets manager.
3. Perform rolling restart of API instances.

---

## 5. Backup & Disaster Recovery Procedures

### 5.1 Automated Daily Logical Backup
Run via scheduled cron container or cloud-native automated backup:
```bash
# Logical dump with compression
pg_dump -h "$DB_HOST" -U "$DB_USER" -d cipherlab -Fc -f "/backups/cipherlab_$(date +%Y%m%d_%H%M%S).dump"

# Upload to encrypted S3 / GCS bucket with lifecycle retention (30 days)
aws s3 cp /backups/ s3://cipherlab-backups-prod/ --recursive --sse AES256
```

### 5.2 Restoring from Backup
```bash
# 1. Stop API instances to prevent writes
# 2. Restore database to target host
pg_restore -h "$DB_HOST" -U "$DB_USER" -d cipherlab -c -v "/backups/cipherlab_target.dump"

# 3. Verify database integrity
psql "$DATABASE_URL" -c "SELECT count(*) FROM lessons; SELECT count(*) FROM users;"

# 4. Start API instances and verify /api/v1/readyz
```

---

## 6. Observability & Alerting Thresholds

| Metric | Warning Threshold | Critical Threshold | Action |
| :--- | :--- | :--- | :--- |
| **API Error Rate (5xx)** | > 1% over 5m | > 5% over 2m | Check Pino error logs for DB/Redis connection issues. |
| **p95 Latency** | > 150 ms over 5m | > 500 ms over 2m | Check DB slow queries, Redis latency, and API CPU load. |
| **Rate Limit Violations (429)** | > 50 / minute | > 200 / minute | Inspect client IPs for abusive scraping or DDoS attempts. |
| **Database Disk Usage** | > 80% | > 90% | Increase volume size or prune old audit logs (`DELETE FROM audit_events WHERE created_at < NOW() - INTERVAL '90 days'`). |
| **Redis Memory** | > 75% | > 90% | Verify eviction policy and increase Redis instance size. |

---

## 7. Non-Negotiable Cryptographic Boundary Audit

Before every release, verify that:
1. No cryptographic API endpoints exist on the server (`GET /api/v1/encrypt` and `GET /api/v1/decrypt` must return 404).
2. Server database schema contains zero columns for plaintext, secret keys, IVs, nonces, or ciphertext.
3. Correct quiz answers (`isCorrect`, `correctIndex`) are strictly stripped from student-facing API endpoints.
4. Pino logger redaction rules cover `req.headers.cookie`, `authorization`, `x-csrf-token`, and cryptographic keywords.

