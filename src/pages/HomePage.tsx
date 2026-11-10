import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  FlaskConical,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { NavigationTab } from '../components/Navbar';
import { ProgressSummary } from '../features/progress/ProgressSummary';
import { StudentProgress } from '../features/progress/types';

interface HomePageProps {
  onNavigate: (tab: NavigationTab) => void;
  progress: StudentProgress;
  onResetProgress: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  progress,
  onResetProgress,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '1rem 0 3rem 0' }}>
      {/* Hero Section */}
      <section
        style={{
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #0f766e 100%)',
          color: '#ffffff',
          padding: '3rem 2rem',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '720px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.12)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem', backdropFilter: 'blur(4px)' }}>
            <Sparkles size={14} color="#99f6e4" />
            <span>Interactive Student Cryptography Lab</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 2.75rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              marginBottom: '1rem',
            }}
          >
            Learn Symmetric Encryption by Actually Trying It.
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '2rem',
            }}
          >
            CipherLab takes you beyond dry theory. Understand the exact difference between block ciphers and stream ciphers, master how AES-GCM works with nonces and authentication tags, and encrypt & decrypt real messages directly in your browser.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onNavigate('lab')}
              className="btn btn-teal"
              style={{
                fontSize: '1rem',
                padding: '0.8rem 1.5rem',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)',
              }}
            >
              <FlaskConical size={18} />
              <span>Open Encryption Lab</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('learn')}
              className="btn btn-outline"
              style={{
                fontSize: '1rem',
                padding: '0.8rem 1.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: 'var(--primary-900)',
                borderColor: '#ffffff',
              }}
            >
              <BookOpen size={18} />
              <span>Start Learning Lessons</span>
            </button>
          </div>
        </div>

        {/* Decorative background grid pattern */}
        <div
          style={{
            position: 'absolute',
            right: '-10%',
            bottom: '-20%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.25) 0%, rgba(49, 46, 129, 0) 70%)',
            pointerEvents: 'none',
          }}
        />
      </section>

      {/* Student Progress Overview */}
      <section>
        <ProgressSummary
          progress={progress}
          onResetProgress={onResetProgress}
          onNavigateToLessons={() => onNavigate('learn')}
          onNavigateToQuiz={() => onNavigate('learn')}
        />
      </section>

      {/* Core Cryptographic Concepts Cards */}
      <section>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            Key Cryptographic Concepts You Will Master
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-slate-600)' }}>
            Clear, accurate fundamentals designed specifically for students new to digital security.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {/* Card 1 */}
          <div className="card card-interactive" onClick={() => onNavigate('learn')} style={{ cursor: 'pointer' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-800)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <KeyRound size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '0.4rem' }}>
              One Shared Secret Key
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', lineHeight: 1.5, margin: 0 }}>
              Symmetric encryption uses the <em>exact same key</em> for locking and unlocking. Sending ciphertext does not solve how both parties safely exchange this secret key.
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-700)' }}>
              <span>Read lesson</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Card 2 */}
          <div className="card card-interactive" onClick={() => onNavigate('learn')} style={{ cursor: 'pointer' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--accent-100)',
                color: 'var(--accent-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Boxes size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '0.4rem' }}>
              Block Ciphers vs. Stream Ciphers
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', lineHeight: 1.5, margin: 0 }}>
              The two primary cipher categories: block ciphers (like AES) process fixed chunks, while stream ciphers (like ChaCha20) generate continuous keystreams.
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-700)' }}>
              <span>View comparison</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Card 3 */}
          <div className="card card-interactive" onClick={() => onNavigate('learn')} style={{ cursor: 'pointer' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-iv-bg)',
                color: 'var(--color-iv-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Sparkles size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '0.4rem' }}>
              Ciphertext & IVs Explained
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', lineHeight: 1.5, margin: 0 }}>
              "Ciphertext" is the encrypted data itself—not a cipher type. The IV (or Nonce) provides freshness so encrypting the same text twice yields totally different outputs.
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-iv-primary)' }}>
              <span>Explore terminology</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Card 4 */}
          <div className="card card-interactive" onClick={() => onNavigate('lab')} style={{ cursor: 'pointer' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-tag-bg)',
                color: 'var(--color-tag-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '0.4rem' }}>
              AES-GCM Authenticated Modes
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', lineHeight: 1.5, margin: 0 }}>
              AES-GCM combines the AES block cipher with Galois/Counter Mode. It provides confidentiality and includes a 128-bit authentication tag protecting against tampering.
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-tag-primary)' }}>
              <span>Try in lab</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Call to Action Banner */}
      <section
        style={{
          backgroundColor: '#ffffff',
          border: '1.5px solid var(--primary-200)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ maxWidth: '600px' }}>
          <span className="badge badge-teal" style={{ marginBottom: '0.5rem' }}>Hands-On Cryptography</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: '0.4rem' }}>
            Ready to test real Web Crypto encryption?
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-slate-600)' }}>
            Enter your own plaintext, generate a 256-bit AES key, inspect the fresh 12-byte IV, and watch how changing a single byte in transit causes decryption to reject the message immediately.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('lab')}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.4rem' }}
        >
          <FlaskConical size={18} />
          <span>Launch Encryption Lab</span>
          <ArrowRight size={16} />
        </button>
      </section>
    </div>
  );
};
