import assert from 'node:assert';
import test from 'node:test';

// Polyfill window for Node test environment
if (typeof globalThis.window === 'undefined') {
  (globalThis as unknown as { window: unknown }).window = {
    crypto: globalThis.crypto,
    isSecureContext: true,
    btoa: (str: string) => Buffer.from(str, 'binary').toString('base64'),
    atob: (b64: string) => Buffer.from(b64, 'base64').toString('binary'),
  };
}

import {
  encryptText,
  decryptPackage,
  generateAes256KeyHex,
  validateAes256HexKey,
  uint8ArrayToHex,
  hexToUint8Array,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from '../src/features/encryption/cryptoService.ts';
import {
  parseAndValidatePackage,
  createCipherPackage,
  serializePackage,
} from '../src/features/encryption/packet.ts';

test('1. Key Generation and Validation', () => {
  const generatedKey = generateAes256KeyHex();
  assert.strictEqual(generatedKey.length, 64, 'Key must be 64 characters');
  assert.match(generatedKey, /^[0-9a-f]{64}$/, 'Key must be lowercase hex');

  const valValid = validateAes256HexKey(generatedKey);
  assert.strictEqual(valValid.isValid, true);

  // Short key
  const valShort = validateAes256HexKey('abcdef1234');
  assert.strictEqual(valShort.isValid, false);
  assert.match(valShort.error || '', /64 hexadecimal characters/);

  // Invalid characters
  const valNonHex = validateAes256HexKey('g'.repeat(64));
  assert.strictEqual(valNonHex.isValid, false);
  assert.match(valNonHex.error || '', /invalid characters/i);

  // Empty key
  const valEmpty = validateAes256HexKey('');
  assert.strictEqual(valEmpty.isValid, false);
});

test('2. Hex and Base64 Encoding Helpers', () => {
  const sample = new Uint8Array([0, 15, 255, 128, 42]);
  const hex = uint8ArrayToHex(sample);
  assert.strictEqual(hex, '000fff802a');

  const backFromHex = hexToUint8Array(hex);
  assert.deepStrictEqual(backFromHex, sample);

  const b64 = uint8ArrayToBase64(sample);
  const backFromB64 = base64ToUint8Array(b64);
  assert.deepStrictEqual(backFromB64, sample);
});

test('3. Packet Serialization and Validation', () => {
  const validIv = Buffer.from(new Uint8Array(12)).toString('base64');
  const validData = Buffer.from(new Uint8Array(20)).toString('base64'); // at least 16 bytes

  const pkg = createCipherPackage(validIv, validData);
  const json = serializePackage(pkg);

  const parsed = parseAndValidatePackage(json);
  assert.strictEqual(parsed.success, true);
  if (parsed.success) {
    assert.strictEqual(parsed.package.version, 1);
    assert.strictEqual(parsed.package.algorithm, 'AES-GCM');
    assert.strictEqual(parsed.package.keyBits, 256);
    assert.strictEqual(parsed.package.iv, validIv);
    assert.strictEqual(parsed.package.data, validData);
  }

  // Reject wrong version
  const badVer = parseAndValidatePackage(JSON.stringify({ ...pkg, version: 2 }));
  assert.strictEqual(badVer.success, false);

  // Reject wrong algorithm
  const badAlgo = parseAndValidatePackage(JSON.stringify({ ...pkg, algorithm: 'AES-CBC' }));
  assert.strictEqual(badAlgo.success, false);

  // Reject wrong IV length (e.g., 16 bytes instead of 12)
  const badIv = Buffer.from(new Uint8Array(16)).toString('base64');
  const badIvPkg = parseAndValidatePackage(JSON.stringify({ ...pkg, iv: badIv }));
  assert.strictEqual(badIvPkg.success, false);
  if (!badIvPkg.success) {
    assert.match(badIvPkg.details || '', /12 bytes/);
  }

  // Reject data too short (<16 bytes auth tag)
  const shortData = Buffer.from(new Uint8Array(10)).toString('base64');
  const shortDataPkg = parseAndValidatePackage(JSON.stringify({ ...pkg, data: shortData }));
  assert.strictEqual(shortDataPkg.success, false);
  if (!shortDataPkg.success) {
    assert.match(shortDataPkg.details || '', /at least 16 bytes/);
  }
});

test('4. End-to-End Encryption and Decryption', async () => {
  const key = generateAes256KeyHex();
  const message = 'Hello, CipherLab! Welcome to Symmetric Cryptography 🚀 🔒 2026';

  const encResult = await encryptText(message, key);
  assert.ok(encResult.packageJson, 'Package JSON must exist');
  assert.ok(encResult.ivBase64, 'IV must exist');
  assert.ok(encResult.ciphertextBase64, 'Ciphertext must exist');
  assert.strictEqual(encResult.tagBytesCount, 16, 'Tag must be 16 bytes');
  assert.strictEqual(encResult.steps.length, 5, 'Must have 5 conceptual visualization steps');

  // Decrypt using same key and package
  const decResult = await decryptPackage(key, encResult.packageJson);
  assert.strictEqual(decResult.plaintext, message, 'Recovered plaintext must match exactly');
  assert.strictEqual(decResult.verified, true, 'Integrity must be verified');
  assert.strictEqual(decResult.keyBits, 256);
  assert.strictEqual(decResult.algorithm, 'AES-GCM');
});

test('5. Nonce / IV Freshness: Same plaintext produces different ciphertexts', async () => {
  const key = generateAes256KeyHex();
  const message = 'Repeatable message for IV test';

  const run1 = await encryptText(message, key);
  const run2 = await encryptText(message, key);

  assert.notStrictEqual(run1.ivBase64, run2.ivBase64, 'Each run must generate a unique fresh IV');
  assert.notStrictEqual(run1.ciphertextBase64, run2.ciphertextBase64, 'Ciphertext must differ due to unique IV');

  // Both still decrypt to the exact same message
  const dec1 = await decryptPackage(key, run1.packageJson);
  const dec2 = await decryptPackage(key, run2.packageJson);
  assert.strictEqual(dec1.plaintext, message);
  assert.strictEqual(dec2.plaintext, message);
});

test('6. Wrong Key Rejection (AEAD Authentication Failure)', async () => {
  const correctKey = generateAes256KeyHex();
  const wrongKey = generateAes256KeyHex();
  const message = 'Confidential student grade data';

  const enc = await encryptText(message, correctKey);

  await assert.rejects(
    async () => {
      await decryptPackage(wrongKey, enc.packageJson);
    },
    (err: Error) => {
      assert.match(err.message, /Authentication Failed|Authentication tag could not be verified/i);
      return true;
    },
    'Decrypting with wrong key must throw an authentication failure error'
  );
});

test('7. Tampered Ciphertext Rejection (Anti-Tampering Integrity)', async () => {
  const key = generateAes256KeyHex();
  const message = 'Transfer $1,000 to Alice';

  const enc = await encryptText(message, key);
  const parsed = JSON.parse(enc.packageJson);

  // Alter one character in the ciphertext data payload
  const origData = parsed.data;
  const flippedChar = origData[origData.length - 2] === 'A' ? 'B' : 'A';
  parsed.data = origData.slice(0, origData.length - 2) + flippedChar + origData.slice(origData.length - 1);
  const tamperedJson = JSON.stringify(parsed);

  await assert.rejects(
    async () => {
      await decryptPackage(key, tamperedJson);
    },
    (err: Error) => {
      assert.match(err.message, /Authentication Failed|Authentication tag could not be verified/i);
      return true;
    },
    'Tampered ciphertext must be rejected by AES-GCM without returning garbled plaintext'
  );
});

test('8. Tampered IV Rejection', async () => {
  const key = generateAes256KeyHex();
  const message = 'Authenticate this!';

  const enc = await encryptText(message, key);
  const parsed = JSON.parse(enc.packageJson);

  // Alter 1 character in the IV
  const origIv = parsed.iv;
  const flippedChar = origIv[0] === 'A' ? 'B' : 'A';
  parsed.iv = flippedChar + origIv.slice(1);
  const tamperedJson = JSON.stringify(parsed);

  await assert.rejects(
    async () => {
      await decryptPackage(key, tamperedJson);
    },
    (err: Error) => {
      assert.match(err.message, /Authentication Failed|Authentication tag could not be verified/i);
      return true;
    },
    'Tampered IV must cause authentication tag verification to fail'
  );
});

