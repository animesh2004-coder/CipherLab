import pino from 'pino';
import { config } from '../config/env.js';

// Non-negotiable security redactions:
// NEVER log sensitive session/auth tokens, and NEVER log any cryptographic lab fields
const REDACTION_PATHS = [
  // Authentication & Session data
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-csrf-token"]',
  'res.headers["set-cookie"]',
  'password',
  '*.password',
  'token',
  '*.token',
  'sessionSecret',
  'codeVerifier',

  // Personal identifiers
  'email',
  '*.email',

  // STRICT CRYPTOGRAPHY BOUNDARY: Absolutely no crypto artifacts in logs
  'plaintext',
  '*.plaintext',
  'key',
  '*.key',
  'keyHex',
  '*.keyHex',
  'iv',
  '*.iv',
  'ciphertext',
  '*.ciphertext',
  'data',
  '*.data',
  'nonce',
  '*.nonce',
  'tag',
  '*.tag',
  'decrypted',
  '*.decrypted',
  'encrypted',
  '*.encrypted',
  'cipherPackage',
  '*.cipherPackage',
];

export function createLogger(name = 'cipherlab-api') {
  return pino({
    name,
    level: config.LOG_LEVEL,
    redact: {
      paths: REDACTION_PATHS,
      censor: '[REDACTED]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  });
}

export const logger = createLogger();

