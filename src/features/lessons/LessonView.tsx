import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Info,
  Lightbulb,
} from 'lucide-react';
import { LESSONS } from './lessonData';

interface LessonViewProps {
  completedLessonIds: string[];
  onToggleLesson: (lessonId: string) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  completedLessonIds,
  onToggleLesson,
}) => {
  const [expandedLessonId, setExpandedLessonId] = useState<string>(LESSONS[0].id);

  const toggleExpand = (id: string) => {
    setExpandedLessonId(expandedLessonId === id ? '' : id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {LESSONS.map((lesson) => {
        const isCompleted = completedLessonIds.includes(lesson.id);
        const isExpanded = expandedLessonId === lesson.id;

        return (
          <div
            key={lesson.id}
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              borderColor: isCompleted ? '#a7f3d0' : isExpanded ? 'var(--primary-300)' : 'var(--color-slate-200)',
              boxShadow: isExpanded ? 'var(--shadow-md)' : 'var(--shadow-sm)',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Header button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                backgroundColor: isExpanded ? 'var(--color-slate-50)' : '#ffffff',
                borderBottom: isExpanded ? '1px solid var(--color-slate-200)' : 'none',
                cursor: 'pointer',
              }}
              onClick={() => toggleExpand(lesson.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLesson(lesson.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: isCompleted ? '#059669' : 'var(--color-slate-300)',
                    transition: 'color 0.15s ease',
                  }}
                  title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                  aria-label={isCompleted ? 'Completed' : 'Incomplete'}
                >
                  {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>

                <div>
                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: isCompleted ? '#065f46' : 'var(--color-slate-900)',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>{lesson.title}</span>
                    {isCompleted && <span className="badge badge-emerald">Completed</span>}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: 'var(--color-slate-500)' }}>
                    {lesson.shortSummary}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-slate-500)',
                  }}
                >
                  <Clock size={12} />
                  <span>{lesson.readTime}</span>
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '0.25rem' }}
                  aria-label={isExpanded ? 'Collapse lesson' : 'Expand lesson'}
                >
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            </div>

            {/* Expanded Lesson Content */}
            {isExpanded && (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {lesson.sections.map((section, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
                      {section.heading}
                    </h4>
                    <p style={{ fontSize: '0.925rem', lineHeight: 1.6, color: 'var(--color-slate-700)', margin: 0 }}>
                      {section.content}
                    </p>

                    {/* Key takeaway */}
                    {section.keyTakeaway && (
                      <div
                        style={{
                          backgroundColor: 'var(--color-slate-100)',
                          borderLeft: '3px solid var(--accent-600)',
                          padding: '0.625rem 0.875rem',
                          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                          fontSize: '0.85rem',
                          color: 'var(--color-slate-800)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <Lightbulb size={16} color="var(--accent-600)" style={{ flexShrink: 0 }} />
                        <span><strong>Key Takeaway:</strong> {section.keyTakeaway}</span>
                      </div>
                    )}

                    {/* Callouts (Tips/Warnings/Info) */}
                    {section.callout && (
                      <div
                        className={`alert alert-${section.callout.type === 'warning' ? 'warning' : section.callout.type === 'tip' ? 'info' : 'success'}`}
                        style={{ margin: '0.35rem 0', padding: '0.75rem 1rem' }}
                      >
                        {section.callout.type === 'warning' ? (
                          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        ) : (
                          <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        )}
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.15rem' }}>
                            {section.callout.title}
                          </strong>
                          <span style={{ fontSize: '0.825rem' }}>{section.callout.text}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Mark as complete footer inside expanded card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--color-slate-200)',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>
                    {isCompleted ? '✓ Marked as completed' : 'Finish reading this lesson to mark it complete'}
                  </span>

                  <button
                    type="button"
                    onClick={() => onToggleLesson(lesson.id)}
                    className={`btn btn-sm ${isCompleted ? 'btn-outline' : 'btn-teal'}`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 size={14} color="#059669" />
                        <span>Completed (Click to Unmark)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Mark Lesson as Complete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
