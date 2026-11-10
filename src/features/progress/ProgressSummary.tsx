import React from 'react';
import { Award, BookOpen, RotateCcw, Trophy } from 'lucide-react';
import { LESSONS } from '../lessons/lessonData';
import { StudentProgress } from './types';

interface ProgressSummaryProps {
  progress: StudentProgress;
  onResetProgress?: () => void;
  onNavigateToLessons?: () => void;
  onNavigateToQuiz?: () => void;
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  progress,
  onResetProgress,
  onNavigateToLessons,
  onNavigateToQuiz,
}) => {
  const completedLessons = progress.completedLessonIds.length;
  const totalLessons = LESSONS.length;
  const lessonPercent = Math.round((completedLessons / totalLessons) * 100);

  const totalPoints = completedLessons + (progress.quizCompleted ? 1 : 0);
  const maxPoints = totalLessons + 1;
  const overallPercent = Math.round((totalPoints / maxPoints) * 100);

  return (
    <div
      className="card"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--color-slate-200)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-slate-900)', margin: 0 }}>
              Your Learning Journey
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
              Saved locally in your browser
            </span>
          </div>
        </div>

        {onResetProgress && (
          <button
            type="button"
            onClick={onResetProgress}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}
            title="Reset lesson progress & quiz scores"
          >
            <RotateCcw size={12} />
            <span>Reset Progress</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
          <span style={{ color: 'var(--color-slate-700)' }}>Course Completion</span>
          <span style={{ color: 'var(--primary-700)' }}>{overallPercent}%</span>
        </div>
        <div
          style={{
            height: '8px',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-slate-200)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${overallPercent}%`,
              backgroundColor: overallPercent === 100 ? '#10b981' : 'var(--accent-600)',
              borderRadius: '9999px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Grid of stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {/* Lessons Progress Card */}
        <div
          style={{
            padding: '0.875rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-slate-50)',
            border: '1px solid var(--color-slate-200)',
            cursor: onNavigateToLessons ? 'pointer' : 'default',
          }}
          onClick={onNavigateToLessons}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-slate-700)' }}>
              <BookOpen size={14} color="var(--primary-600)" />
              <span>Core Lessons</span>
            </span>
            <span className="badge badge-indigo">{lessonPercent}%</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            {completedLessons} / {totalLessons}
          </div>
          <span style={{ fontSize: '0.725rem', color: 'var(--color-slate-500)' }}>
            {completedLessons === totalLessons ? 'All lessons read!' : `${totalLessons - completedLessons} remaining`}
          </span>
        </div>

        {/* Quiz Progress Card */}
        <div
          style={{
            padding: '0.875rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-slate-50)',
            border: '1px solid var(--color-slate-200)',
            cursor: onNavigateToQuiz ? 'pointer' : 'default',
          }}
          onClick={onNavigateToQuiz}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-slate-700)' }}>
              <Award size={14} color="var(--accent-600)" />
              <span>Knowledge Check</span>
            </span>
            {progress.quizCompleted ? (
              <span className="badge badge-emerald">Passed</span>
            ) : (
              <span className="badge badge-slate">Not taken</span>
            )}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            {progress.quizCompleted ? `${progress.quizScore} / ${progress.quizTotal}` : '0 / 5'}
          </div>
          <span style={{ fontSize: '0.725rem', color: 'var(--color-slate-500)' }}>
            {progress.quizCompleted
              ? `Score: ${Math.round((progress.quizScore / progress.quizTotal) * 100)}%`
              : 'Take the 5-question test'}
          </span>
        </div>
      </div>
    </div>
  );
};
