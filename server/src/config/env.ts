// ============================================================================
// CipherLab Server – Zod-validated environment configuration
// Loads and validates all required/optional environment variables at startup.
// Throws a clear, actionable error if any required variable is missing.
// NEVER logs secret values.
// ============================================================================

import 'dotenv/config';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const envSchema = z.object({
  // --- Required ---
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').default('postgresql://cipherlab_dev:cipherlab_dev_pass@localhost:5432/cipherlab'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required').default('redis://localhost:6379'),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters')
    .default('test_secret_must_be_at_least_32_characters_long_for_dev_and_tests'),
  OIDC_ISSUER_URL: z.string().min(1, 'OIDC_ISSUER_URL is required').default('http://localhost:3001/mock-oidc'),
  OIDC_CLIENT_ID: z.string().min(1, 'OIDC_CLIENT_ID is required').default('cipherlab-dev-client'),
  OIDC_CLIENT_SECRET: z.string().min(1, 'OIDC_CLIENT_SECRET is required').default('cipherlab-dev-secret'),
  OIDC_REDIRECT_URI: z
    .string()
    .min(1, 'OIDC_REDIRECT_URI is required')
    .default('http://localhost:3001/auth/callback'),
  ALLOWED_ORIGINS: z
    .string()
    .min(1, 'ALLOWED_ORIGINS is required')
    .default('http://localhost:5173,http://localhost:3000')
    .transform((val) =>
      val
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),

  // --- Optional ---
  OIDC_SCOPES: z.string().default('openid profile email'),
  SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(86400),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  REQUEST_BODY_LIMIT: z.string().default('1mb'),
  COOKIE_DOMAIN: z.string().optional(),
  TRUST_PROXY: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
});

// ---------------------------------------------------------------------------
// Validate & export
// ---------------------------------------------------------------------------

export type EnvConfig = z.infer<typeof envSchema>;

function loadConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return `  • ${path}: ${issue.message}`;
      })
      .join('\n');

    // Use console.error directly – logger depends on config, so it's not
    // available yet at this point.
    console.error(
      '\n❌  Environment validation failed:\n' +
        formatted +
        '\n\nSee server/.env.example for reference.\n',
    );

    throw new Error(`Invalid environment configuration: ${result.error.message}`);
  }

  return result.data;
}

/**
 * Validated, typed environment configuration.
 * Imported as a singleton; crashes the process at startup if invalid.
 */
export const config: EnvConfig = loadConfig();
