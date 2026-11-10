import React, { useState } from 'react';
import {
  FileText,
  Key,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  Wand2,
} from 'lucide-react';
import { CopyButton } from '../../components/CopyButton';
import { decryptPackage, validateAes256HexKey } from './cryptoService';
import { parseAndValidatePackage } from './packet';
import { DecryptionResult } from './types';

interface DecryptSectionProps {
  initialKey?: string;
  initialPackageJson?: string;
}

export const DecryptSection: React.FC<DecryptSectionProps> = ({
  initialKey = '',
  initialPackageJson = '',
}) => {
  const [keyHex, setKeyHex] = useState(initialKey);
  const [packageJson, setPackageJson] = useState(initialPackageJson);
  const [result, setResult] = useState<DecryptionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Update if props change
  React.useEffect(() => {
    if (initialKey) setKeyHex(initialKey);
    if (initialPackageJson) setPackageJson(initialPackageJson);
  }, [initialKey, initialPackageJson]);

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResult(null);

    const cleanKey = keyHex.trim();
    const cleanPkg = packageJson.trim();

    if (!cleanKey) {
      setErrorMessage('Please enter the 64-character hexadecimal AES-256 secret key.');
      return;
    }

    if (!cleanPkg) {
      setErrorMessage('Please paste the JSON cipher package.');
      return;
    }

    // Pre-validate key
    const keyVal = validateAes256HexKey(cleanKey);
    if (!keyVal.isValid) {
      setErrorMessage(keyVal.error || 'Invalid key format.');
      return;
    }

    // Pre-validate package
    const pkgVal = parseAndValidatePackage(cleanPkg);
    if (!pkgVal.success) {
      setErrorMessage(`${pkgVal.error}: ${pkgVal.details || ''}`);
      return;
    }

    setIsDecrypting(true);
    try {
      const decResult = await decryptPackage(cleanKey, cleanPkg);
      setResult(decResult);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsDecrypting(false);
    }
  };

  // Student experiment: deliberately tamper with the package to see AEAD protection in action!
  const handleTamperPayload = () => {
    if (!packageJson.trim()) {
      setErrorMessage('Please paste a package first before testing tampering.');
      return;
    }
    try {
      const parsed = JSON.parse(packageJson);
      if (parsed && typeof parsed.data === 'string' && parsed.data.length > 5) {
        // Change one character in the Base64 data
        const origData = parsed.data;
        const charToSwap = origData[origData.length - 2] === 'A' ? 'B' : 'A';
        parsed.data = origData.slice(0, origData.length - 2) + charToSwap + origData.slice(origData.length - 1);
        setPackageJson(JSON.stringify(parsed, null, 2));
        setErrorMessage(
          'Tampered! Altered 1 character of the encrypted data payload. Click "Decrypt Message" to see the authentication tag catch this modification!'
        );
        setResult(null);
      }
    } catch {
      setErrorMessage('Could not tamper: the current text is not valid JSON.');
    }
  };

  // Mutate key slightly to test wrong key failure
  const handleWrongKey = () => {
    if (!keyHex.trim() || keyHex.length !== 64) {
      // Set a sample wrong key
      setKeyHex('0000000000000000000000000000000000000000000000000000000000000001');
    } else {
      // Flip the last character
      const lastChar = keyHex.slice(-1);
      const flipped = lastChar === '0' ? '1' : '0';
      setKeyHex(keyHex.slice(0, -1) + flipped);
    }
    setErrorMessage('Changed key to an incorrect key! Click "Decrypt Message" to test wrong key rejection.');
    setResult(null);
  };

  const handleReset = () => {
    setKeyHex('');
    setPackageJson('');
    setResult(null);
    setErrorMessage(null);
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
        <Unlock size={18} color="var(--accent-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--color-slate-900)' }}>How Decryption Works in this Lab:</strong>
          <span style={{ display: 'block', marginTop: '0.2rem' }}>
            AES-GCM requires the <strong>exact same secret key</strong> and the original <strong>IV</strong>.
            Before showing plaintext, it cryptographically verifies the <strong>16-byte authentication tag</strong>.
            If the key is wrong or if a single bit was tampered with, decryption halts with a clear error.
          </span>
        </div>
      </div>

      <form onSubmit={handleDecrypt}>
        {/* Step 1: Secret Key */}
        <div className="form-group">
          <label htmlFor="decrypt-key-input" className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="badge badge-amber">1. Secret Key</span>
              <span>AES-256 Key (64 Hex Characters)</span>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: keyHex.length === 64 ? '#059669' : 'var(--color-slate-400)' }}>
              {keyHex.length}/64 hex
            </span>
          </label>
          <input
            id="decrypt-key-input"
            type="text"
            className="form-input form-mono"
            placeholder="Paste the 64-character hex key here..."
            value={keyHex}
            onChange={(e) => setKeyHex(e.target.value.trim())}
            maxLength={64}
          />
          <span className="form-hint">
            Must match the exact key used during encryption.
          </span>
        </div>

        {/* Step 2: JSON Package */}
        <div className="form-group" style={{ marginTop: '1.25rem' }}>
          <div className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="badge badge-indigo">2. Cipher Package</span>
              <span>Transport JSON (Contains IV & Encrypted Payload)</span>
            </span>
            {packageJson && (
              <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                {packageJson.length} chars
              </span>
            )}
          </div>
          <textarea
            id="package-json-input"
            className="form-textarea form-mono"
            style={{ minHeight: '120px', fontSize: '0.785rem' }}
            placeholder={`Paste the JSON package here, e.g.:
{
  "version": 1,
  "algorithm": "AES-GCM",
  "keyBits": 256,
  "iv": "...",
  "data": "..."
}`}
            value={packageJson}
            onChange={(e) => setPackageJson(e.target.value)}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
            <span className="form-hint">
              CipherLab validates the version, algorithm, IV size (12 bytes), and data payload.
            </span>
            {/* Student Experiment Tools */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleTamperPayload}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', border: '1px dashed #f43f5e', color: '#e11d48' }}
                title="Modify 1 character in the ciphertext to test AEAD authentication failure"
              >
                <Wand2 size={12} />
                <span>Test Tampered Ciphertext</span>
              </button>
              <button
                type="button"
                onClick={handleWrongKey}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', border: '1px dashed #d97706', color: '#b45309' }}
                title="Use an incorrect key to test authentication tag rejection"
              >
                <Key size={12} />
                <span>Test Wrong Key</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={isDecrypting || !keyHex.trim() || !packageJson.trim()}
            className="btn btn-teal"
            style={{ flex: '1 1 200px' }}
          >
            {isDecrypting ? (
              <>
                <Unlock size={16} className="animate-pulse-slow" />
                <span>Verifying & Decrypting...</span>
              </>
            ) : (
              <>
                <Unlock size={16} />
                <span>Decrypt Message</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="btn btn-outline"
            title="Clear all fields"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </form>

      {/* Failure Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="alert alert-error animate-fade-in"
          style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}
        >
          <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.925rem', marginBottom: '0.25rem' }}>
              Decryption Rejected
            </strong>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>{errorMessage}</p>
            <div
              style={{
                marginTop: '0.75rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid #fecdd3',
                fontSize: '0.775rem',
                color: '#881337',
              }}
            >
              💡 <strong>Why this happens:</strong> AES-GCM provides <em>Authenticated Encryption</em>. If the key is wrong or if any part of the IV or ciphertext was altered, the cryptographic tag check fails and prevents showing corrupt or deceptive plaintext.
            </div>
          </div>
        </div>
      )}

      {/* Success Result Container */}
      {result && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid #10b981',
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
              <ShieldCheck size={22} color="#059669" />
              <div>
                <strong style={{ fontSize: '1.05rem', color: '#065f46', display: 'block' }}>
                  Decryption & Authentication Verified
                </strong>
                <span style={{ fontSize: '0.75rem', color: '#047857' }}>
                  16-byte GCM authentication tag matched · Message is authentic and untampered
                </span>
              </div>
            </div>

            <CopyButton textToCopy={result.plaintext} label="Copy Plaintext" />
          </div>

          {/* Recovered Plaintext Card */}
          <div className="token-card token-card-plaintext" style={{ margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-plaintext-dark)' }}>
                <FileText size={15} />
                <span>Recovered Plaintext</span>
                <span className="badge badge-emerald">{result.byteLength} UTF-8 bytes</span>
              </span>
            </div>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-plaintext-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-slate-900)',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
              }}
            >
              {result.plaintext || <em style={{ color: 'var(--color-slate-400)' }}>(Empty message)</em>}
            </div>
          </div>

          {/* Verification details */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--color-slate-200)',
              fontSize: '0.775rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--color-slate-500)', display: 'block' }}>Cipher Algorithm:</span>
              <strong style={{ color: 'var(--color-slate-800)' }}>AES-GCM (Block cipher in GCM)</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-slate-500)', display: 'block' }}>Key Strength:</span>
              <strong style={{ color: 'var(--color-slate-800)' }}>{result.keyBits}-bit AES Key</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-slate-500)', display: 'block' }}>Integrity Status:</span>
              <strong style={{ color: '#059669' }}>Cryptographically Verified</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
