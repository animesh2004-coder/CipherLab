import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  Boxes,
  FlaskConical,
  GraduationCap,
} from 'lucide-react';
import { NavigationTab } from '../components/Navbar';
import { ComparisonTable } from '../features/lessons/ComparisonTable';
import { LessonView } from '../features/lessons/LessonView';
import { QuizView } from '../features/lessons/QuizView';
import { LESSONS } from '../features/lessons/lessonData';
import { StudentProgress } from '../features/progress/types';

export type LearnSubTab = 'lessons' | 'comparison' | 'quiz';

interface LearnPageProps {
  progress: StudentProgress;
  onToggleLesson: (lessonId: string) => void;
  onSaveQuizProgress: (answers: Record<string, number>, score: number, total: number) => void;
  onNavigate: (tab: NavigationTab) => void;
  initialSubTab?: LearnSubTab;
}

export const LearnPage: React.FC<LearnPageProps> = ({
  progress,
  onToggleLesson,
  onSaveQuizProgress,
  onNavigate,
  initialSubTab = 'lessons',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<LearnSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const completedCount = progress.completedLessonIds.length;
  const totalLessons = LESSONS.length;

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
              <span className="badge badge-indigo">
                <GraduationCap size={14} /> Curriculum
              </span>
              <span className="badge badge-teal">Beginner Friendly</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: 0 }}>
              Symmetric Cryptography Fundamentals
            </h1>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.925rem', color: 'var(--color-slate-600)' }}>
              Master shared keys, block vs. stream ciphers, ciphertext semantics, and authenticated modes.
            </p>
          </div>

          {/* Progress Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: 'var(--color-slate-50)',
              border: '1px solid var(--color-slate-200)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.75rem 1.25rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', display: 'block' }}>
                Lessons Completed
              </span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--color-slate-900)' }}>
                {completedCount} / {totalLessons}
              </strong>
            </div>
            <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--color-slate-200)' }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', display: 'block' }}>
                Knowledge Quiz
              </span>
              <strong style={{ fontSize: '1.15rem', color: progress.quizCompleted ? '#059669' : 'var(--color-slate-600)' }}>
                {progress.quizCompleted ? `${progress.quizScore}/5 Passed` : 'Pending'}
              </strong>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Nav */}
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
            onClick={() => setActiveSubTab('lessons')}
            className={`btn ${activeSubTab === 'lessons' ? 'btn-primary' : 'btn-outline'}`}
          >
            <BookOpen size={16} />
            <span>Interactive Lessons ({completedCount}/{totalLessons})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('comparison')}
            className={`btn ${activeSubTab === 'comparison' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Boxes size={16} />
            <span>Block vs. Stream Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('quiz')}
            className={`btn ${activeSubTab === 'quiz' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Award size={16} />
            <span>Knowledge Check Quiz {progress.quizCompleted && '✓'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeSubTab === 'lessons' && (
        <LessonView
          completedLessonIds={progress.completedLessonIds}
          onToggleLesson={onToggleLesson}
        />
      )}

      {activeSubTab === 'comparison' && <ComparisonTable />}

      {activeSubTab === 'quiz' && (
        <QuizView
          initialAnswers={progress.quizAnswers}
          initialCompleted={progress.quizCompleted}
          initialScore={progress.quizScore}
          onSaveQuizProgress={onSaveQuizProgress}
        />
      )}

      {/* Footer Navigation CTA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-slate-200)',
          padding: '1.25rem 1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <strong style={{ display: 'block', color: 'var(--color-slate-900)' }}>
            Ready to test theory in practice?
          </strong>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
            Jump into the encryption lab to encrypt and decrypt live data with AES-GCM.
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('lab')}
          className="btn btn-teal"
        >
          <FlaskConical size={16} />
          <span>Open Encryption Lab</span>
        </button>
      </div>
    </div>
  );
};
