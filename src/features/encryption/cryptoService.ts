import type {
  DecryptionResult,
  EncryptionResult,
  EncryptionStep,
} from './types.ts';
import {
  createCipherPackage,
  parseAndValidatePackage,
  serializePackage,
} from './packet.ts';

/**
 * Checks if Web Crypto is supported in the current browser/context
 */
export function isWebCryptoSupported(): { supported: boolean; reason?: string } {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Window object is not defined (SSR environment).' };
  }
  if (!window.crypto || !window.crypto.subtle) {
    if (!window.isSecureContext) {
      return {
        supported: false,
        reason:
          'Web Crypto API requires a secure context (HTTPS or localhost). Please run or load the app over localhost or HTTPS.',
      };
    }
    return {
      supported: false,
      reason: 'Your browser does not support the Web Crypto SubtleCrypto API.',
    };
  }
  return { supported: true };
}

/**
 * Converts a Uint8Array to a lowercase Hexadecimal string
 */
export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a Hexadecimal string to a Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.trim().replace(/\s+/g, '');
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Hex string must have an even number of characters.');
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    const byte = parseInt(cleanHex.substring(i, i + 2), 16);
    if (isNaN(byte)) {
      throw new Error(`Invalid hexadecimal byte at position ${i}: "${cleanHex.substring(i, i + 2)}"`);
    }
    bytes[i / 2] = byte;
  }
  return bytes;
}

/**
 * Converts a Uint8Array to a Base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Converts a Base64 string to a Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.trim();
  const binary = window.atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Formats a hex string into spaced byte groups (e.g. for display)
 */
export function formatHexWithSpaces(hex: string, groupSize: number = 2): string {
  const clean = hex.trim().toLowerCase();
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += groupSize) {
    chunks.push(clean.slice(i, i + groupSize));
  }
  return chunks.join(' ');
}

/**
 * Validates a 64-character hexadecimal AES-256 key
 */
export function validateAes256HexKey(keyHex: string): { isValid: boolean; error?: string } {
  const clean = keyHex.trim();
  if (!clean) {
    return { isValid: false, error: 'Key is required. Please generate or paste a key.' };
  }
  if (clean.length !== 64) {
    return {
      isValid: false,
      error: `Key must be exactly 64 hexadecimal characters (32 bytes / 256 bits). Current length is ${clean.length}.`,
    };
  }
  if (!/^[0-9a-fA-F]{64}$/.test(clean)) {
    return {
      isValid: false,
      error: 'Key contains invalid characters. Hexadecimal keys only allow characters 0-9 and a-f (or A-F).',
    };
  }
  return { isValid: true };
}

/**
 * Generates a cryptographically secure random 256-bit (32 bytes) key as a 64-char hex string
 */
export function generateAes256KeyHex(): string {
  const keyBytes = new Uint8Array(32);
  window.crypto.getRandomValues(keyBytes);
  return uint8ArrayToHex(keyBytes);
}

/**
 * Generates a fresh 12-byte (96-bit) Initialization Vector (IV/Nonce) for AES-GCM
 */
export function generateAesGcmIv(): Uint8Array {
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);
  return iv;
}

/**
 * Encrypts plaintext using AES-GCM with a 256-bit key and fresh 12-byte IV.
 * Everything remains strictly in frontend memory.
 */
export async function encryptText(
  plaintext: string,
  keyHex: string
): Promise<EncryptionResult> {
  const cryptoCheck = isWebCryptoSupported();
  if (!cryptoCheck.supported) {
    throw new Error(cryptoCheck.reason || 'Web Crypto is unavailable.');
  }

  // Validate Key
  const keyVal = validateAes256HexKey(keyHex);
  if (!keyVal.isValid) {
    throw new Error(keyVal.error || 'Invalid AES-256 key');
  }

  // 1. Encode Plaintext as UTF-8
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(plaintext);

  // 2. Prepare Key
  const rawKeyBytes = hexToUint8Array(keyHex);
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    rawKeyBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // 3. Generate Fresh 12-byte IV
  const ivBytes = generateAesGcmIv();
  const ivBase64 = uint8ArrayToBase64(ivBytes);

  // 4. Encrypt with AES-GCM (128-bit authentication tag default)
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as unknown as BufferSource,
      tagLength: 128, // 16 bytes authentication tag
    },
    cryptoKey,
    utf8Bytes as unknown as BufferSource
  );

  const fullEncryptedBytes = new Uint8Array(encryptedBuffer);
  const ciphertextBase64 = uint8ArrayToBase64(fullEncryptedBytes);

  // In Web Crypto AES-GCM, the authentication tag is appended at the end (16 bytes = 128 bits)
  const tagByteLength = 16;
  const rawCipherByteLength = Math.max(0, fullEncryptedBytes.length - tagByteLength);

  const rawCipherBytes = fullEncryptedBytes.slice(0, rawCipherByteLength);
  const tagBytes = fullEncryptedBytes.slice(rawCipherByteLength);

  const rawCiphertextBase64 = uint8ArrayToBase64(rawCipherBytes);
  const tagBase64 = uint8ArrayToBase64(tagBytes);

  // 5. Build standard transport package
  const cipherPackage = createCipherPackage(ivBase64, ciphertextBase64);
  const packageJson = serializePackage(cipherPackage);

  // Prepare conceptual step visualizer data
  const steps: EncryptionStep[] = [
    {
      id: 'plaintext',
      title: 'Step 1: Plaintext Input',
      subtitle: 'The original unencrypted message',
      description:
        'The human-readable message you entered. Before encryption begins, computers must convert human characters into a raw binary format.',
      dataSnippet: plaintext.length > 40 ? plaintext.slice(0, 37) + '...' : plaintext || '(empty message)',
      badge: `${plaintext.length} characters`,
      accentColor: 'emerald',
      technicalDetails: [
        { label: 'Character count', value: `${plaintext.length}` },
        { label: 'State', value: 'Unencrypted (Plaintext)' },
        { label: 'Confidentiality', value: 'Zero (readable by anyone)' },
      ],
    },
    {
      id: 'utf8',
      title: 'Step 2: UTF-8 Byte Encoding',
      subtitle: 'Converting characters into byte stream',
      description:
        'Ciphers do not operate directly on letters or emojis; they operate on bytes. UTF-8 standardizes each character into 1 to 4 raw binary octets.',
      dataSnippet:
        formatHexWithSpaces(uint8ArrayToHex(utf8Bytes.slice(0, 16))) +
        (utf8Bytes.length > 16 ? ` ... (+${utf8Bytes.length - 16} more bytes)` : ''),
      badge: `${utf8Bytes.length} bytes`,
      accentColor: 'amber',
      technicalDetails: [
        { label: 'Encoded Byte Length', value: `${utf8Bytes.length} bytes` },
        { label: 'Character Encoding', value: 'UTF-8 standard' },
        { label: 'Byte Preview (Hex)', value: uint8ArrayToHex(utf8Bytes.slice(0, 8)) || 'none' },
      ],
    },
    {
      id: 'aes-gcm',
      title: 'Step 3: AES Block Cipher with GCM Mode',
      subtitle: 'Encrypting with 256-bit Key & 96-bit Nonce/IV',
      description:
        'AES is a block cipher that operates on 128-bit blocks. Galois/Counter Mode (GCM) turns it into an authenticated stream-like mode using a counter combined with the unique IV.',
      dataSnippet:
        rawCiphertextBase64.length > 32
          ? rawCiphertextBase64.slice(0, 32) + '...'
          : rawCiphertextBase64 || '(zero ciphertext bytes)',
      badge: 'AES-256 (GCM)',
      accentColor: 'cyan',
      technicalDetails: [
        { label: 'Algorithm Category', value: 'Block cipher in GCM counter mode' },
        { label: 'Key Size', value: '256 bits (32 bytes)' },
        { label: 'IV / Nonce Size', value: '96 bits (12 bytes) - Generated Fresh' },
        { label: 'Cipher Output Length', value: `${rawCipherByteLength} bytes` },
      ],
    },
    {
      id: 'authtag',
      title: 'Step 4: Cryptographic Authentication Tag',
      subtitle: 'Galois MAC ensures message integrity',
      description:
        'AES-GCM computes a 128-bit GHASH authentication tag over the ciphertext and IV. If even 1 single bit is modified during transit, decryption is rejected.',
      dataSnippet: tagBase64,
      badge: '128-bit Auth Tag',
      accentColor: 'rose',
      technicalDetails: [
        { label: 'Tag Length', value: '16 bytes (128 bits)' },
        { label: 'Role', value: 'Guarantees integrity & authenticity' },
        { label: 'Tamper Protection', value: 'Any modification causes decryption to fail' },
      ],
    },
    {
      id: 'package',
      title: 'Step 5: Standard JSON Package & Base64 Packaging',
      subtitle: 'Safe serialization for transmission',
      description:
        'Raw binary bytes cannot be safely transmitted in text protocols (like email, JSON, or chat). We encode the IV and encrypted payload in Base64 and wrap them in a transport package.',
      dataSnippet: `{"version":1,"algorithm":"AES-GCM",...}`,
      badge: 'Version 1 Package',
      accentColor: 'violet',
      technicalDetails: [
        { label: 'Serialization', value: 'Standard JSON' },
        { label: 'Binary Encoding', value: 'Base64 (ASCII safe)' },
        { label: 'Key Included in Package?', value: 'NO (Shared out-of-band)' },
      ],
    },
  ];

  return {
    keyHex: keyHex.toLowerCase(),
    ivBase64,
    ciphertextBase64,
    rawCiphertextBase64,
    tagBase64,
    packageJson,
    cipherPackage,
    plaintext,
    utf8BytesCount: utf8Bytes.length,
    cipherBytesCount: rawCipherByteLength,
    tagBytesCount: tagByteLength,
    steps,
    timestamp: Date.now(),
  };
}

/**
 * Decrypts a CipherLab package using a 256-bit key.
 * Strictly verifies authentication tag; fails if key or ciphertext is altered.
 */
export async function decryptPackage(
  keyHex: string,
  rawPackageJson: string
): Promise<DecryptionResult> {
  const cryptoCheck = isWebCryptoSupported();
  if (!cryptoCheck.supported) {
    throw new Error(cryptoCheck.reason || 'Web Crypto is unavailable.');
  }

  // 1. Validate Key
  const keyVal = validateAes256HexKey(keyHex);
  if (!keyVal.isValid) {
    throw new Error(keyVal.error || 'Invalid AES-256 key');
  }

  // 2. Parse & Validate Package
  const parseResult = parseAndValidatePackage(rawPackageJson);
  if (!parseResult.success) {
    throw new Error(`${parseResult.error}: ${parseResult.details || ''}`);
  }

  const pkg = parseResult.package;

  // 3. Decode Base64 payloads
  let ivBytes: Uint8Array;
  let dataBytes: Uint8Array;
  try {
    ivBytes = base64ToUint8Array(pkg.iv);
  } catch {
    throw new Error('Failed to decode the Base64 IV. The IV format is corrupted.');
  }

  try {
    dataBytes = base64ToUint8Array(pkg.data);
  } catch {
    throw new Error('Failed to decode the Base64 encrypted data. The payload format is corrupted.');
  }

  if (ivBytes.length !== 12) {
    throw new Error(`Invalid IV length: expected 12 bytes, got ${ivBytes.length} bytes.`);
  }

  if (dataBytes.length < 16) {
    throw new Error('Encrypted data too short. Must include at least the 16-byte authentication tag.');
  }

  // 4. Import Key for decryption
  const rawKeyBytes = hexToUint8Array(keyHex);
  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      rawKeyBytes as unknown as BufferSource,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
  } catch (err) {
    throw new Error(`Failed to load key into Web Crypto: ${(err as Error).message}`);
  }

  // 5. Decrypt using AES-GCM
  // If the key is wrong OR any bit of data/iv was tampered with, Web Crypto throws an OperationError
  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes as unknown as BufferSource,
        tagLength: 128,
      },
      cryptoKey,
      dataBytes as unknown as BufferSource
    );
  } catch {
    // Deliberately friendly and educational error
    throw new Error(
      'Decryption & Authentication Failed: The authentication tag could not be verified. This happens when the secret key is wrong, or when the ciphertext / IV has been altered or damaged in transit. AES-GCM guarantees that modified data will never produce misleading corrupted output.'
    );
  }

  // 6. Decode UTF-8 plaintext
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const plaintext = decoder.decode(decryptedBuffer);

    return {
      plaintext,
      algorithm: pkg.algorithm,
      keyBits: pkg.keyBits,
      byteLength: decryptedBuffer.byteLength,
      verified: true,
      decryptedAt: Date.now(),
    };
  } catch {
    throw new Error(
      'Decryption succeeded cryptographically, but the recovered bytes are not valid UTF-8 text.'
    );
  }
}
