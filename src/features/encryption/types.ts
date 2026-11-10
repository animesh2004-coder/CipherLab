/**
 * Types for CipherLab Encryption, Packaging, and Visualization
 */

export interface CipherPackage {
  version: 1;
  algorithm: 'AES-GCM';
  keyBits: 256;
  iv: string; // Base64 encoded 12-byte IV (96 bits)
  data: string; // Base64 encoded ciphertext + 16-byte authentication tag
}

export interface EncryptionStep {
  id: 'plaintext' | 'utf8' | 'aes-gcm' | 'authtag' | 'package';
  title: string;
  subtitle: string;
  description: string;
  dataSnippet?: string;
  badge?: string;
  accentColor: 'emerald' | 'amber' | 'violet' | 'cyan' | 'rose';
  technicalDetails: {
    label: string;
    value: string;
  }[];
}

export interface EncryptionResult {
  keyHex: string;
  ivBase64: string;
  ciphertextBase64: string; // Combined ciphertext + tag in Base64
  rawCiphertextBase64: string; // Ciphertext portion only
  tagBase64: string; // Authentication tag portion only (16 bytes)
  packageJson: string;
  cipherPackage: CipherPackage;
  plaintext: string;
  utf8BytesCount: number;
  cipherBytesCount: number;
  tagBytesCount: number;
  steps: EncryptionStep[];
  timestamp: number;
}

export interface DecryptionResult {
  plaintext: string;
  algorithm: string;
  keyBits: number;
  byteLength: number;
  verified: boolean;
  decryptedAt: number;
}

export interface CryptoValidationResult {
  isValid: boolean;
  message?: string;
}

