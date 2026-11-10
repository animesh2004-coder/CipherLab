import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Key,
  Lock,
  RefreshCw,
  RotateCcw,
  Shield,
  Sparkles,
} from 'lucide-react';
import { CopyButton } from '../../components/CopyButton';
import {
  encryptText,
  generateAes256KeyHex,
  validateAes256HexKey,
} from './cryptoService';
import { EncryptionResult } from './types';

interface EncryptSectionProps {
  onEncryptionSuccess: (result: EncryptionResult) => void;
  onSendToDecrypt: (keyHex: string, packageJson: string) => void;
}

const SAMPLE_TEXTS = [
  'Meet at the secret library archive at 14:00.',
  'Symmetric ciphers use the exact same key for encrypt & decrypt!',
  'AES-GCM guarantees both confidentiality and authenticity.',
];

export const EncryptSection: React.FC<EncryptSectionProps> = ({
  onEncryptionSuccess,
  onSendToDecrypt,
}) => {
  const [plaintext, setPlaintext] = useState('');
  const [keyHex, setKeyHex] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EncryptionResult | null>(null);

  // Quick Key Generator
  const handleGenerateKey = () => {
    try {
      const newKey = generateAes256KeyHex();
      setKeyHex(newKey);
      setKeyError(null);
    } catch (err) {
      setKeyError((err as Error).message);
    }
  };

  // Real-time Key Validation
  const handleKeyChange = (val: string) => {
    const cleaned = val.trim();
    setKeyHex(cleaned);
    if (!cleaned) {
      setKeyError(null);
      return;
    }
    const valResult = validateAes256HexKey(cleaned);
    setKeyError(valResult.isValid ? null : valResult.error || 'Invalid key');
  };

  // Perform Encryption
  const handleEncrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!plaintext.trim()) {
      setGeneralError('Please enter some plaintext to encrypt.');
      return;
    }

    if (!keyHex.trim()) {
      // Auto-generate if empty for a seamless student onboarding experience
      const newKey = generateAes256KeyHex();
      setKeyHex(newKey);
      await executeEncryption(plaintext, newKey);
      return;
    }

    const valResult = validateAes256HexKey(keyHex);
    if (!valResult.isValid) {
      setKeyError(valResult.error || 'Invalid AES-256 key');
      return;
    }

    await executeEncryption(plaintext, keyHex);
  };

  const executeEncryption = async (text: string, key: string) => {
    setIsLoading(true);
    try {
      const res = await encryptText(text, key);
      setResult(res);
      onEncryptionSuccess(res);
    } catch (err) {
      setGeneralError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setPlaintext('');
    setKeyHex('');
    setKeyError(null);
    setGeneralError(null);
    setResult(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Intro info box */}
      <div
        style={{
          backgroundColor: 'var(--color-slate-50)',
          border: '1px solid var(--color-slate-200)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          fontSize: '0.875rem',
          color: 'var(--color-slate-700)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}
      >
        <Lock size={18} color="var(--primary-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--color-slate-900)' }}>How Encryption Works in this Lab:</strong>
          <span style={{ display: 'block', marginTop: '0.2rem' }}>
            We use the browser’s built-in <strong>Web Crypto API</strong> with standard <strong>AES-GCM (256-bit)</strong>.
            A fresh 12-byte IV is generated for each operation. Plaintext and keys stay strictly in temporary memory.
          </span>
        </div>
      </div>

      {generalError && (
        <div role="alert" className="alert alert-error">
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleEncrypt}>
        {/* Step 1: Plaintext Input */}
        <div className="form-group">
          <label htmlFor="plaintext-input" className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="badge badge-emerald">1. Plaintext</span>
              <span>Message to Encrypt</span>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
              {plaintext.length} characters
            </span>
          </label>
          <textarea
            id="plaintext-input"
            className="form-textarea"
            placeholder="Type secret text here (e.g., 'Antigravity launch codes')..."
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            rows={3}
            aria-describedby="plaintext-hint"
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span id="plaintext-hint" className="form-hint">
              Encoded to raw UTF-8 bytes before encryption.
            </span>
            {/* Quick samples */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', alignSelf: 'center' }}>
                Samples:
              </span>
              {SAMPLE_TEXTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPlaintext(sample)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', border: '1px dashed var(--color-slate-300)' }}
                >
                  Text #{idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Secret Key Input */}
        <div className="form-group" style={{ marginTop: '1.25rem' }}>
          <div className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="badge badge-amber">2. Secret Key</span>
              <span>AES-256 Key (64 Hex Characters)</span>
            </span>
            <button
              type="button"
              onClick={handleGenerateKey}
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              <RefreshCw size={12} />
              <span>Generate Random Key</span>
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              id="key-input"
              type="text"
              className={`form-input form-mono ${keyError ? 'border-rose' : ''}`}
              placeholder="Generate key or paste 64 hex characters (e.g., 4f8b9...)"
              value={keyHex}
              onChange={(e) => handleKeyChange(e.target.value)}
              aria-describedby="key-hint"
              maxLength={64}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem' }}>
            <span id="key-hint" className="form-hint" style={{ color: keyError ? '#e11d48' : 'var(--color-slate-500)' }}>
              {keyError || 'Must be kept secret in real use. Anyone with this key can decrypt the data.'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: keyHex.length === 64 ? '#059669' : 'var(--color-slate-400)' }}>
              {keyHex.length}/64 hex
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={isLoading || !plaintext.trim()}
            className="btn btn-primary"
            style={{ flex: '1 1 200px' }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-pulse-slow" />
                <span>Encrypting...</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>Encrypt Plaintext</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="btn btn-outline"
            title="Reset encrypt form"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </form>

      {/* Encryption Result Card */}
      {result && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--accent-500)',
            backgroundColor: '#ffffff',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--color-slate-200)',
              paddingBottom: '0.875rem',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={20} color="var(--accent-600)" />
              <strong style={{ fontSize: '1.05rem', color: 'var(--color-slate-900)' }}>
                Encryption Succeeded
              </strong>
              <span className="badge badge-teal">AES-GCM-256</span>
            </div>

            <button
              type="button"
              onClick={() => onSendToDecrypt(result.keyHex, result.packageJson)}
              className="btn btn-sm btn-teal"
              title="Pre-fill these values in the Decrypt tab"
            >
              <span>Use this result in Decrypt</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Cryptographic outputs grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* 1. Secret Key Field */}
            <div className="token-card token-card-key" style={{ margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-key-dark)' }}>
                  <Key size={14} />
                  <span>Secret Key (Hexadecimal)</span>
                  <span className="badge badge-amber">32 bytes · 256 bits</span>
                </span>
                <CopyButton textToCopy={result.keyHex} label="Copy Key" />
              </div>
              <div className="code-block" style={{ fontSize: '0.785rem', wordBreak: 'break-all' }}>
                {result.keyHex}
              </div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-key-dark)' }}>
                ⚠️ <strong>Secret:</strong> Share this key securely with the intended receiver only.
              </p>
            </div>

            {/* 2. Initialization Vector (IV) */}
            <div className="token-card token-card-iv" style={{ margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-iv-dark)' }}>
                  <Sparkles size={14} />
                  <span>Initialization Vector (IV / Nonce)</span>
                  <span className="badge badge-violet">12 bytes (96 bits) · Fresh</span>
                </span>
                <CopyButton textToCopy={result.ivBase64} label="Copy IV" />
              </div>
              <div className="code-block" style={{ fontSize: '0.785rem', wordBreak: 'break-all' }}>
                {result.ivBase64}
              </div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-iv-dark)' }}>
                ℹ️ <strong>Not a secret:</strong> Needed for decryption. A fresh IV was generated to prevent pattern leaks.
              </p>
            </div>

            {/* 3. Encrypted Output + Auth Tag */}
            <div className="token-card token-card-cipher" style={{ margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-cipher-dark)' }}>
                  <Cpu size={14} />
                  <span>Encrypted Output (Ciphertext + 16-byte Auth Tag)</span>
                  <span className="badge badge-blue">{result.cipherBytesCount} bytes cipher + 16 bytes tag</span>
                </span>
                <CopyButton textToCopy={result.ciphertextBase64} label="Copy Ciphertext" />
              </div>
              <div className="code-block" style={{ fontSize: '0.785rem', wordBreak: 'break-all' }}>
                {result.ciphertextBase64}
              </div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-cipher-dark)' }}>
                🔒 <strong>Includes 16-byte GCM Authentication Tag:</strong> Web Crypto automatically verifies this tag during decryption to prevent tampering.
              </p>
            </div>

            {/* 4. Complete Transport JSON Package */}
            <div
              style={{
                backgroundColor: 'var(--color-slate-50)',
                border: '1px solid var(--color-slate-300)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-slate-800)' }}>
                  <Shield size={14} color="var(--primary-600)" />
                  <span>Standard CipherLab JSON Package</span>
                  <span className="badge badge-indigo">Version 1</span>
                </span>
                <CopyButton textToCopy={result.packageJson} label="Copy JSON Package" />
              </div>
              <pre className="code-block" style={{ margin: 0, fontSize: '0.78rem' }}>
                {result.packageJson}
              </pre>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.75rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-600)' }}>
                  Note: The JSON package contains the IV, version, algorithm, and data payload, but <strong>NEVER</strong> contains the secret key!
                </span>
                <button
                  type="button"
                  onClick={() => onSendToDecrypt(result.keyHex, result.packageJson)}
                  className="btn btn-sm btn-teal"
                >
                  <span>Test in Decrypt Section</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

