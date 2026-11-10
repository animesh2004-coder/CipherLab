import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { Footer } from '../components/Footer';
import { Navbar, NavigationTab } from '../components/Navbar';
import { WebCryptoNotice } from '../components/WebCryptoNotice';
import { INITIAL_PROGRESS, StudentProgress } from '../features/progress/types';
import { HomePage } from '../pages/HomePage';
import { LabPage } from '../pages/LabPage';
import { LearnPage } from '../pages/LearnPage';
import { apiService } from '../services/apiService';
import type { ApiUser } from '@cipherlab/shared';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [progress, setProgress] = useState<StudentProgress>(INITIAL_PROGRESS);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Initialize session and progress on mount
  useEffect(() => {
    // Check for login query params
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('login') === 'success') {
      setNotification({
        type: 'success',
        message: 'Successfully signed in! Your lesson progress and quiz results are syncing.',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (searchParams.get('login') === 'failed') {
      setNotification({
        type: 'error',
        message: 'Sign-in could not be completed. You can continue as a guest or retry.',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Load active session and progress
    apiService.getSession().then((session) => {
      if (session.authenticated && session.user) {
        setCurrentUser(session.user);
      }
      return apiService.getProgress().then((p) => {
        setProgress(p);
      });
    });
  }, []);

  const handleToggleLesson = async (lessonId: string) => {
    const updated = await apiService.updateLessonProgress(lessonId);
    setProgress(updated);
  };

  const handleSaveQuizProgress = async (
    answers: Record<string, number>,
    score: number,
    total: number
  ) => {
    const updated = await apiService.submitQuiz(answers, score, total);
    setProgress(updated);
  };

  const handleResetProgress = async () => {
    if (window.confirm('Reset all saved lesson completion and quiz progress?')) {
      const reset = await apiService.resetAllProgress();
      setProgress(reset);
      setNotification({
        type: 'info',
        message: 'Local learning progress has been reset.',
      });
    }
  };

  const handleLogin = () => {
    window.location.href = '/auth/login';
  };

  const handleDevLogin = async (displayName?: string) => {
    try {
      const session = await apiService.devLogin(displayName);
      if (session.user) {
        setCurrentUser(session.user);
        const p = await apiService.getProgress();
        setProgress(p);
        setNotification({
          type: 'success',
          message: `Signed in as ${session.user.displayName}. Progress is synced with the production server.`,
        });
      }
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Dev login failed',
      });
    }
  };

  const handleLogout = async () => {
    await apiService.logout();
    setCurrentUser(null);
    const p = await apiService.getProgress();
    setProgress(p);
    setNotification({
      type: 'info',
      message: 'Signed out. You are now browsing in offline guest mode.',
    });
  };

  const handleExportData = async () => {
    try {
      const exportData = await apiService.exportUserData();
      if (exportData) {
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cipherlab-data-${currentUser?.displayName || 'student'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setNotification({
          type: 'success',
          message: 'Account progress and GDPR records downloaded successfully.',
        });
      }
    } catch {
      setNotification({
        type: 'error',
        message: 'Failed to export account data.',
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Sticky Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        progress={progress}
        currentUser={currentUser}
        onLogin={handleLogin}
        onDevLogin={handleDevLogin}
        onLogout={handleLogout}
        onExportData={handleExportData}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        <div className="container">
          {/* Notification banner */}
          {notification && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor:
                  notification.type === 'success'
                    ? '#ecfdf5'
                    : notification.type === 'error'
                      ? '#fff1f2'
                      : '#eff6ff',
                border: `1px solid ${
                  notification.type === 'success'
                    ? '#a7f3d0'
                    : notification.type === 'error'
                      ? '#fecdd3'
                      : '#bfdbfe'
                }`,
                color:
                  notification.type === 'success'
                    ? '#065f46'
                    : notification.type === 'error'
                      ? '#9f1239'
                      : '#1e40af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {notification.type === 'success' && <CheckCircle size={18} />}
                {notification.type === 'error' && <AlertCircle size={18} />}
                {notification.type === 'info' && <Info size={18} />}
                <span>{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  color: 'inherit',
                }}
                aria-label="Dismiss alert"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <WebCryptoNotice />

          {currentTab === 'home' && (
            <HomePage
              onNavigate={setCurrentTab}
              progress={progress}
              onResetProgress={handleResetProgress}
            />
          )}

          {currentTab === 'learn' && (
            <LearnPage
              progress={progress}
              onToggleLesson={handleToggleLesson}
              onSaveQuizProgress={handleSaveQuizProgress}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'lab' && <LabPage />}
        </div>
      </main>

      {/* Accessible Footer */}
      <Footer />
    </div>
  );
};
export default App;
