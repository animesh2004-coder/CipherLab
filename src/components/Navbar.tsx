import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  Download,
  FlaskConical,
  Home,
  KeyRound,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { StudentProgress } from '../features/progress/types';
import { LESSONS } from '../features/lessons/lessonData';
import type { ApiUser } from '@cipherlab/shared';

export type NavigationTab = 'home' | 'learn' | 'lab';

interface NavbarProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab, subTab?: string) => void;
  progress: StudentProgress;
  currentUser?: ApiUser | null;
  onLogin?: () => void;
  onDevLogin?: (displayName?: string) => void;
  onLogout?: () => void;
  onExportData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  progress,
  currentUser,
  onLogin,
  onDevLogin,
  onLogout,
  onExportData,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [devStudentName, setDevStudentName] = useState('Student Learner');

  const completedCount = progress.completedLessonIds.length;
  const totalLessons = LESSONS.length;
  const totalProgressPercent = Math.round(
    ((completedCount + (progress.quizCompleted ? 1 : 0)) / (totalLessons + 1)) * 100
  );

  const handleNavClick = (tab: NavigationTab, subTab?: string) => {
    onNavigate(tab, subTab);
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDevLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onDevLogin) {
      onDevLogin(devStudentName.trim() || 'Student Learner');
    }
    setLoginModalOpen(false);
  };

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--color-slate-200)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4rem',
        }}
      >
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: 'var(--radius-md)',
          }}
          aria-label="CipherLab Home"
        >
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '10px',
              backgroundColor: 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 4px rgba(67, 56, 202, 0.25)',
            }}
          >
            <KeyRound size={18} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <span
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--color-slate-900)',
                display: 'block',
                lineHeight: 1.1,
              }}
            >
              Cipher<span style={{ color: 'var(--accent-600)' }}>Lab</span>
            </span>
            <span
              style={{
                fontSize: '0.675rem',
                fontWeight: 600,
                color: 'var(--color-slate-500)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Symmetric Crypto
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          className="nav-desktop"
        >
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className={`btn ${currentTab === 'home' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.875rem' }}
          >
            <Home size={16} />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('learn', 'lessons')}
            className={`btn ${currentTab === 'learn' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.875rem' }}
          >
            <BookOpen size={16} />
            <span>Lessons & Quiz</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('lab')}
            className={`btn ${currentTab === 'lab' ? 'btn-teal' : 'btn-outline'}`}
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              borderWidth: currentTab === 'lab' ? 1 : 1,
            }}
          >
            <FlaskConical size={16} />
            <span>Encryption Lab</span>
          </button>
        </nav>

        {/* Header Right: Account, Progress Badge & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* Progress pill */}
          <button
            type="button"
            onClick={() => handleNavClick('learn', 'lessons')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--color-slate-100)',
              border: '1px solid var(--color-slate-200)',
              borderRadius: '9999px',
              padding: '0.35rem 0.75rem',
              cursor: 'pointer',
              fontSize: '0.785rem',
              fontWeight: 600,
              color: 'var(--color-slate-700)',
            }}
            title="View learning progress"
          >
            <ShieldCheck size={14} color="var(--accent-600)" />
            <span>
              {completedCount}/{totalLessons} Lessons
            </span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: totalProgressPercent === 100 ? '#10b981' : 'var(--primary-600)',
              }}
            />
            <span style={{ color: 'var(--color-slate-500)', fontSize: '0.725rem' }}>
              {totalProgressPercent}%
            </span>
          </button>

          {/* Account indicator / Login button */}
          {currentUser ? (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: 'var(--primary-50)',
                  border: '1px solid var(--primary-200)',
                  borderRadius: '9999px',
                  padding: '0.35rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.785rem',
                  fontWeight: 600,
                  color: 'var(--primary-900)',
                }}
                aria-label="User account menu"
                aria-expanded={accountMenuOpen}
              >
                <User size={13} color="var(--primary-700)" />
                <span>{currentUser.displayName}</span>
                <ChevronDown size={12} />
              </button>

              {/* Account Dropdown */}
              {accountMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    right: 0,
                    width: '14rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--color-slate-200)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.5rem',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-slate-100)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-slate-900)' }}>
                      {currentUser.displayName}
                    </div>
                    {currentUser.email && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        {currentUser.email}
                      </div>
                    )}
                    <div style={{ marginTop: '0.35rem' }}>
                      <span className="badge badge-indigo" style={{ fontSize: '0.675rem' }}>
                        {currentUser.role}
                      </span>
                    </div>
                  </div>

                  {onExportData && (
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        onExportData();
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.785rem' }}
                    >
                      <Download size={14} />
                      <span>Export My Data (GDPR)</span>
                    </button>
                  )}

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        onLogout();
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{
                        justifyContent: 'flex-start',
                        width: '100%',
                        fontSize: '0.785rem',
                        color: 'var(--color-rose-600, #e11d48)',
                      }}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.785rem', fontWeight: 600, gap: '0.35rem', padding: '0.35rem 0.75rem' }}
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost btn-sm nav-mobile-toggle"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            style={{ padding: '0.4rem', border: '1px solid var(--color-slate-200)' }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid var(--color-slate-200)',
            backgroundColor: '#ffffff',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
          className="nav-mobile-dropdown"
        >
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className={`btn ${currentTab === 'home' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <Home size={18} />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('learn', 'lessons')}
            className={`btn ${currentTab === 'learn' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <BookOpen size={18} />
            <span>Lessons & Quiz ({completedCount}/{totalLessons})</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('lab')}
            className={`btn ${currentTab === 'lab' ? 'btn-teal' : 'btn-outline'}`}
            style={{ justifyContent: 'flex-start', width: '100%', fontWeight: 700 }}
          >
            <FlaskConical size={18} />
            <span>Interactive Encryption Lab</span>
          </button>

          {currentUser ? (
            <div
              style={{
                marginTop: '0.5rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--color-slate-200)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-600)' }}>
                Signed in as <strong>{currentUser.displayName}</strong>
              </div>
              {onExportData && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onExportData();
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Download size={16} />
                  <span>Export My Data</span>
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'flex-start', color: '#e11d48' }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-slate-200)' }}>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLoginModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <LogIn size={16} />
                <span>Sign In to Student Account</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sign In Modal */}
      {loginModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
          onClick={() => setLoginModalOpen(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '24rem',
              width: '100%',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                Sign In to CipherLab
              </h3>
              <button
                type="button"
                onClick={() => setLoginModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.25rem' }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Sign in to save your lesson progress, take official server-graded quizzes, and track your cryptographic learning across devices.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* OIDC Single Sign-On Button */}
              {onLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setLoginModalOpen(false);
                    onLogin();
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <KeyRound size={16} />
                  <span>Sign In with School / SSO (OIDC)</span>
                </button>
              )}

              {/* Dev / Test Login form */}
              {onDevLogin && (
                <form
                  onSubmit={handleDevLoginSubmit}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    borderTop: '1px solid var(--color-slate-200)',
                    paddingTop: '0.75rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-slate-600)' }}>
                    Development One-Click Sign In:
                  </label>
                  <input
                    type="text"
                    value={devStudentName}
                    onChange={(e) => setDevStudentName(e.target.value)}
                    placeholder="Enter student name"
                    className="input"
                    style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                  />
                  <button
                    type="submit"
                    className="btn btn-teal btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <span>One-Click Dev Login</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Responsive media styling for desktop vs mobile nav */}
      <style>{`
        @media (min-width: 640px) {
          .nav-desktop {
            display: flex !important;
          }
          .nav-mobile-toggle {
            display: none !important;
          }
          .nav-mobile-dropdown {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
