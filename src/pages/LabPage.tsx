import React, { useState } from 'react';
import {
  Cpu,
  FlaskConical,
  Lock,
  Unlock,
} from 'lucide-react';
import { DecryptSection } from '../features/encryption/DecryptSection';
import { EncryptSection } from '../features/encryption/EncryptSection';
import { VisualizerSection } from '../features/encryption/VisualizerSection';
import { EncryptionResult } from '../features/encryption/types';

export type LabTab = 'encrypt' | 'decrypt' | 'visualizer';

export const LabPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LabTab>('encrypt');
  const [encryptionResult, setEncryptionResult] = useState<EncryptionResult | null>(null);

  // States to pass over to the Decrypt tab
  const [decryptKeyHex, setDecryptKeyHex] = useState('');
  const [decryptPackageJson, setDecryptPackageJson] = useState('');

  const handleEncryptionSuccess = (result: EncryptionResult) => {
    setEncryptionResult(result);
  };

  const handleSendToDecrypt = (keyHex: string, packageJson: string) => {
    setDecryptKeyHex(keyHex);
    setDecryptPackageJson(packageJson);
    setActiveTab('decrypt');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0 3rem 0' }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-slate-200)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-teal">
                <FlaskConical size={14} /> Interactive Lab
              </span>
              <span className="badge badge-indigo">AES-GCM (256-bit)</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: 0 }}>
              Symmetric Encryption & Decryption Lab
            </h1>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.925rem', color: 'var(--color-slate-600)' }}>
              Encrypt text with real Web Crypto AES-GCM, inspect the cryptographic package, and decrypt it back using the same secret key.
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1.75rem',
            borderTop: '1px solid var(--color-slate-200)',
            paddingTop: '1.25rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('encrypt')}
            className={`btn ${activeTab === 'encrypt' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontWeight: 700 }}
          >
            <Lock size={16} />
            <span>1. Encrypt Message</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decrypt')}
            className={`btn ${activeTab === 'decrypt' ? 'btn-teal' : 'btn-outline'}`}
            style={{ fontWeight: 700 }}
          >
            <Unlock size={16} />
            <span>2. Decrypt Message</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visualizer')}
            className={`btn ${activeTab === 'visualizer' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontWeight: 700 }}
          >
            <Cpu size={16} />
            <span>3. Step Visualizer {encryptionResult && '✓'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Panels */}
      {activeTab === 'encrypt' && (
        <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
          <EncryptSection
            onEncryptionSuccess={handleEncryptionSuccess}
            onSendToDecrypt={handleSendToDecrypt}
          />
        </div>
      )}

      {activeTab === 'decrypt' && (
        <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
          <DecryptSection
            initialKey={decryptKeyHex}
            initialPackageJson={decryptPackageJson}
          />
        </div>
      )}

      {activeTab === 'visualizer' && (
        <VisualizerSection encryptionResult={encryptionResult} />
      )}
    </div>
  );
};
