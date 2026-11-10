import React from 'react';
import { ShieldCheck, Lock, Cpu, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        marginTop: 'auto',
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--color-slate-200)',
        padding: '2.5rem 0 2rem 0',
        color: 'var(--color-slate-600)',
        fontSize: '0.85rem',
      }}
    >
      <div className="container">
        {/* Memory safety assurance banner */}
        <div
          style={{
            backgroundColor: 'var(--color-slate-50)',
            border: '1px solid var(--color-slate-200)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-100)',
                color: 'var(--accent-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <strong style={{ color: 'var(--color-slate-900)', display: 'block' }}>
                Strict Frontend In-Memory Cryptography
              </strong>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-slate-600)' }}>
                Plaintext and cryptographic keys exist only in temporary JavaScript memory. Nothing is ever sent to a server, put in URL query params, or stored in browser storage.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-emerald">W3C Web Crypto API</span>
            <span className="badge badge-indigo">AES-256-GCM</span>
          </div>
        </div>

        {/* Fact pills */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <Lock size={18} color="var(--primary-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--color-slate-800)', fontSize: '0.825rem' }}>Symmetric Rule</strong>
              <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--color-slate-500)' }}>
                One shared secret key encrypts and decrypts. Key distribution is solved separately.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <Cpu size={18} color="var(--accent-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--color-slate-800)', fontSize: '0.825rem' }}>Two Cipher Classes</strong>
              <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--color-slate-500)' }}>
                Block ciphers (e.g. AES) and stream ciphers (e.g. ChaCha20). Ciphertext is the data itself.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <Sparkles size={18} color="var(--color-iv-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--color-slate-800)', fontSize: '0.825rem' }}>AEAD Guarantee</strong>
              <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--color-slate-500)' }}>
                AES-GCM includes an authentication tag ensuring tamper detection alongside secrecy.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright / note */}
        <div
          style={{
            borderTop: '1px solid var(--color-slate-200)',
            paddingTop: '1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            fontSize: '0.775rem',
            color: 'var(--color-slate-500)',
          }}
        >
          <div>
            <strong>CipherLab</strong> · Interactive Cryptography Learning Platform for Students
          </div>
          <div>
            Built with React, TypeScript & Web Crypto API
          </div>
        </div>
      </div>
    </footer>
  );
};

