import type { CipherPackage } from './types.ts';

/**
 * Base64 validation and decoding helper for packet validation
 */
export function isValidBase64(str: string): boolean {
  if (typeof str !== 'string' || str.trim().length === 0) {
    return false;
  }
  // Base64 pattern check
  const trimmed = str.trim();
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  if (!base64Regex.test(trimmed)) {
    return false;
  }
  try {
    return window.atob(trimmed).length > 0;
  } catch {
    return false;
  }
}

/**
 * Decode base64 to byte length
 */
export function getBase64ByteLength(str: string): number {
  try {
    return window.atob(str.trim()).length;
  } catch {
    return -1;
  }
}

/**
 * Creates a valid CipherPackage object
 */
export function createCipherPackage(ivBase64: string, dataBase64: string): CipherPackage {
  return {
    version: 1,
    algorithm: 'AES-GCM',
    keyBits: 256,
    iv: ivBase64.trim(),
    data: dataBase64.trim(),
  };
}

/**
 * Serializes a CipherPackage into a formatted JSON string
 */
export function serializePackage(pkg: CipherPackage): string {
  return JSON.stringify(pkg, null, 2);
}

export type ParsePackageResult =
  | { success: true; package: CipherPackage }
  | { success: false; error: string; details?: string };

/**
 * Parses and validates an encryption package from raw input
 */
export function parseAndValidatePackage(rawInput: string): ParsePackageResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'Empty package input',
      details: 'Please paste a valid CipherLab JSON package.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    return {
      success: false,
      error: 'Invalid JSON format',
      details: `The input is not valid JSON. Ensure you copied the entire package including opening and closing braces. (${(err as Error).message})`,
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      success: false,
      error: 'Malformed package structure',
      details: 'Cipher package must be a JSON object.',
    };
  }

  const obj = parsed as Record<string, unknown>;

  // Check version
  if (obj.version !== 1) {
    return {
      success: false,
      error: 'Unsupported package version',
      details: `Expected version 1, but received ${String(obj.version)}. CipherLab only supports version 1.`,
    };
  }

  // Check algorithm
  if (obj.algorithm !== 'AES-GCM') {
    return {
      success: false,
      error: 'Unsupported algorithm',
      details: `Expected algorithm "AES-GCM", but received "${String(obj.algorithm)}".`,
    };
  }

  // Check keyBits
  if (obj.keyBits !== 256) {
    return {
      success: false,
      error: 'Unsupported key size',
      details: `Expected keyBits to be 256, but received ${String(obj.keyBits)}.`,
    };
  }

  // Check IV
  if (typeof obj.iv !== 'string' || !obj.iv.trim()) {
    return {
      success: false,
      error: 'Missing Initialization Vector (IV)',
      details: 'Package must include a valid Base64-encoded "iv" field.',
    };
  }

  if (!isValidBase64(obj.iv)) {
    return {
      success: false,
      error: 'Invalid IV Base64 format',
      details: 'The "iv" field contains characters that are not valid Base64.',
    };
  }

  const ivBytes = getBase64ByteLength(obj.iv);
  if (ivBytes !== 12) {
    return {
      success: false,
      error: 'Invalid IV length',
      details: `AES-GCM standard IV must be exactly 12 bytes (96 bits). Decoded IV was ${ivBytes} bytes.`,
    };
  }

  // Check data (ciphertext + tag)
  if (typeof obj.data !== 'string' || !obj.data.trim()) {
    return {
      success: false,
      error: 'Missing encrypted data payload',
      details: 'Package must include a Base64-encoded "data" field containing ciphertext and authentication tag.',
    };
  }

  if (!isValidBase64(obj.data)) {
    return {
      success: false,
      error: 'Invalid ciphertext Base64 format',
      details: 'The "data" field contains characters that are not valid Base64.',
    };
  }

  const dataBytes = getBase64ByteLength(obj.data);
  // AES-GCM output always contains at least the 16-byte (128-bit) authentication tag
  if (dataBytes < 16) {
    return {
      success: false,
      error: 'Incomplete encrypted data payload',
      details: `The "data" field must be at least 16 bytes (to include the 128-bit authentication tag). Received only ${dataBytes} bytes.`,
    };
  }

  return {
    success: true,
    package: {
      version: 1,
      algorithm: 'AES-GCM',
      keyBits: 256,
      iv: obj.iv.trim(),
      data: obj.data.trim(),
    },
  };
}
