import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  CloudCheck,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { QUIZ_QUESTIONS } from './lessonData';
import { apiService } from '../../services/apiService';
import type { ApiQuiz, ApiQuizGradeResult } from '@cipherlab/shared';

interface QuizViewProps {
  initialAnswers: Record<string, number>;
  initialCompleted: boolean;
  initialScore: number;
  onSaveQuizProgress: (answers: Record<string, number>, score: number, total: number) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  initialAnswers,
  initialCompleted,
  initialScore,
  onSaveQuizProgress,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(initialAnswers);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(initialCompleted);
  const [score, setScore] = useState<number>(initialScore);

  // Server-integrated quiz state
  const [apiQuiz, setApiQuiz] = useState<ApiQuiz | null>(null);
  const [serverGradeResult, setServerGradeResult] = useState<ApiQuizGradeResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string>>({});

  // On mount, attempt to load quiz from API (if online & authenticated)
  useEffect(() => {
    let active = true;
    apiService.getApiQuiz('symmetric-encryption-fundamentals').then((quiz) => {
      if (active && quiz && quiz.questions.length > 0) {
        setApiQuiz(quiz);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSelectOption = (questionId: string, optionIndex: number, optionId?: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
    if (optionId) {
      setSelectedOptionIds((prev) => ({
        ...prev,
        [questionId]: optionId,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // If we have an API quiz and authenticated session, submit to server for atomic grading
      if (apiQuiz && Object.keys(selectedOptionIds).length === apiQuiz.questions.length) {
        const gradeResult = await apiService.submitQuizAttempt(
          apiQuiz.slug,
          selectedOptionIds
        );

        if (gradeResult) {
          setServerGradeResult(gradeResult);
          setScore(gradeResult.score);
          setIsSubmitted(true);
          onSaveQuizProgress(selectedAnswers, gradeResult.score, gradeResult.totalQuestions);
          setIsSubmitting(false);
          return;
        }
      }

      // Offline / guest mode fallback grading
      let calculatedScore = 0;
      QUIZ_QUESTIONS.forEach((q) => {
        if (selectedAnswers[q.id] === q.correctIndex) {
          calculatedScore += 1;
        }
      });

      setScore(calculatedScore);
      setIsSubmitted(true);
      onSaveQuizProgress(selectedAnswers, calculatedScore, QUIZ_QUESTIONS.length);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setIsSubmitted(false);
    setSelectedAnswers({});
    setSelectedOptionIds({});
    setServerGradeResult(null);
    setScore(0);
  };

  const totalQuestions = apiQuiz ? apiQuiz.questions.length : QUIZ_QUESTIONS.length;
  const allAnswered = apiQuiz
    ? apiQuiz.questions.every((q) => selectedOptionIds[q.id] !== undefined)
    : QUIZ_QUESTIONS.every((q) => selectedAnswers[q.id] !== undefined);
  const percentScore = Math.round((score / totalQuestions) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Quiz Intro Card */}
      <div
        className="card"
        style={{
          borderLeft: '4px solid var(--accent-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--color-slate-900)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: 0,
              }}
            >
              <Award size={20} color="var(--accent-600)" />
              <span>Symmetric Encryption Knowledge Check</span>
            </h3>
            {serverGradeResult && (
              <span className="badge badge-emerald" title="Graded and recorded on the production server">
                <CloudCheck size={12} /> Server-Graded
              </span>
            )}
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
            Test your understanding of symmetric ciphers, AES-GCM, IVs, ciphertext, and the key sharing problem.
          </p>
        </div>

        {isSubmitted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', display: 'block' }}>
                Your Score
              </span>
              <strong style={{ fontSize: '1.25rem', color: score >= 4 ? '#059669' : '#d97706' }}>
                {score} / {totalQuestions} ({percentScore}%)
              </strong>
            </div>
            <button type="button" onClick={handleRetake} className="btn btn-sm btn-outline">
              <RotateCcw size={14} />
              <span>Retake Quiz</span>
            </button>
          </div>
        )}
      </div>

      {/* Questions list */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {apiQuiz
          ? // Render server-provided questions (omitting answer keys until graded)
            apiQuiz.questions.map((question, qIdx) => {
              const selectedOptId = selectedOptionIds[question.id];
              const gradedItem = serverGradeResult?.questions.find((g) => g.questionId === question.id);
              const isCorrect = gradedItem?.isCorrect ?? false;

              return (
                <div
                  key={question.id}
                  className="card"
                  style={{
                    border: isSubmitted
                      ? isCorrect
                        ? '1.5px solid #10b981'
                        : '1.5px solid #f43f5e'
                      : '1px solid var(--color-slate-200)',
                    boxShadow: varCssShadow(isSubmitted, isCorrect),
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      marginBottom: '0.875rem',
                    }}
                  >
                    <h4 style={{ fontSize: '0.975rem', fontWeight: 700, color: 'var(--color-slate-900)', lineHeight: 1.4 }}>
                      <span style={{ color: 'var(--primary-700)', marginRight: '0.4rem' }}>
                        Q{qIdx + 1}.
                      </span>
                      {question.questionText}
                    </h4>

                    {isSubmitted && gradedItem && (
                      <span
                        className={`badge ${isCorrect ? 'badge-emerald' : 'badge-rose'}`}
                        style={{ flexShrink: 0 }}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 size={12} /> Correct
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Incorrect
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {question.options.map((option, optIdx) => {
                      const isThisSelected = selectedOptId === option.id;
                      const isThisCorrect = gradedItem?.correctOptionId === option.id;

                      let optBg = '#ffffff';
                      let optBorder = 'var(--color-slate-200)';
                      let optColor = 'var(--color-slate-800)';

                      if (isSubmitted) {
                        if (isThisCorrect) {
                          optBg = '#ecfdf5';
                          optBorder = '#10b981';
                          optColor = '#065f46';
                        } else if (isThisSelected && !isThisCorrect) {
                          optBg = '#fff1f2';
                          optBorder = '#f43f5e';
                          optColor = '#9f1239';
                        }
                      } else if (isThisSelected) {
                        optBg = 'var(--primary-50)';
                        optBorder = 'var(--primary-500)';
                        optColor = 'var(--primary-900)';
                      }

                      return (
                        <label
                          key={option.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${optBorder}`,
                            backgroundColor: optBg,
                            color: optColor,
                            cursor: isSubmitted ? 'default' : 'pointer',
                            transition: 'all 0.15s ease',
                            fontSize: '0.875rem',
                            fontWeight: isThisSelected || (isSubmitted && isThisCorrect) ? 600 : 400,
                          }}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option.id}
                            checked={isThisSelected}
                            onChange={() => handleSelectOption(question.id, optIdx, option.id)}
                            disabled={isSubmitted}
                            style={{ accentColor: 'var(--primary-600)' }}
                          />
                          <span style={{ flex: 1 }}>{option.optionText}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Explanation after submission */}
                  {isSubmitted && gradedItem && (
                    <div
                      style={{
                        marginTop: '0.875rem',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-slate-100)',
                        fontSize: '0.8rem',
                        color: 'var(--color-slate-700)',
                        lineHeight: 1.5,
                      }}
                    >
                      <strong>Explanation:</strong> {gradedItem.explanation}
                    </div>
                  )}
                </div>
              );
            })
          : // Render fallback local questions
            QUIZ_QUESTIONS.map((question, qIdx) => {
              const selectedOption = selectedAnswers[question.id];
              const isCorrect = selectedOption === question.correctIndex;

              return (
                <div
                  key={question.id}
                  className="card"
                  style={{
                    border: isSubmitted
                      ? isCorrect
                        ? '1.5px solid #10b981'
                        : '1.5px solid #f43f5e'
                      : '1px solid var(--color-slate-200)',
                    boxShadow: varCssShadow(isSubmitted, isCorrect),
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      marginBottom: '0.875rem',
                    }}
                  >
                    <h4 style={{ fontSize: '0.975rem', fontWeight: 700, color: 'var(--color-slate-900)', lineHeight: 1.4 }}>
                      <span style={{ color: 'var(--primary-700)', marginRight: '0.4rem' }}>
                        Q{qIdx + 1}.
                      </span>
                      {question.question}
                    </h4>

                    {isSubmitted && (
                      <span
                        className={`badge ${isCorrect ? 'badge-emerald' : 'badge-rose'}`}
                        style={{ flexShrink: 0 }}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 size={12} /> Correct
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Incorrect
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {question.options.map((option, optIdx) => {
                      const isThisSelected = selectedOption === optIdx;
                      const isThisCorrectAnswer = optIdx === question.correctIndex;

                      let optBg = '#ffffff';
                      let optBorder = 'var(--color-slate-200)';
                      let optColor = 'var(--color-slate-800)';

                      if (isSubmitted) {
                        if (isThisCorrectAnswer) {
                          optBg = '#ecfdf5';
                          optBorder = '#10b981';
                          optColor = '#065f46';
                        } else if (isThisSelected && !isThisCorrectAnswer) {
                          optBg = '#fff1f2';
                          optBorder = '#f43f5e';
                          optColor = '#9f1239';
                        }
                      } else if (isThisSelected) {
                        optBg = 'var(--primary-50)';
                        optBorder = 'var(--primary-500)';
                        optColor = 'var(--primary-900)';
                      }

                      return (
                        <label
                          key={optIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${optBorder}`,
                            backgroundColor: optBg,
                            color: optColor,
                            cursor: isSubmitted ? 'default' : 'pointer',
                            transition: 'all 0.15s ease',
                            fontSize: '0.875rem',
                            fontWeight: isThisSelected || (isSubmitted && isThisCorrectAnswer) ? 600 : 400,
                          }}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={optIdx}
                            checked={isThisSelected}
                            onChange={() => handleSelectOption(question.id, optIdx)}
                            disabled={isSubmitted}
                            style={{ accentColor: 'var(--primary-600)' }}
                          />
                          <span style={{ flex: 1 }}>{option}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Explanation after submission */}
                  {isSubmitted && (
                    <div
                      style={{
                        marginTop: '0.875rem',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-slate-100)',
                        fontSize: '0.8rem',
                        color: 'var(--color-slate-700)',
                        lineHeight: 1.5,
                      }}
                    >
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  )}
                </div>
              );
            })}

        {/* Submit Bar */}
        {!isSubmitted && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              backgroundColor: '#ffffff',
              border: '1px solid var(--color-slate-200)',
              borderRadius: 'var(--radius-lg)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
              {allAnswered ? (
                <span style={{ color: '#059669', fontWeight: 600 }}>
                  ✓ All {totalQuestions} questions answered
                </span>
              ) : (
                <span>Please answer all {totalQuestions} questions to submit</span>
              )}
            </span>

            <button
              type="submit"
              disabled={!allAnswered || isSubmitting}
              className="btn btn-teal"
              style={{ fontWeight: 700 }}
            >
              {isSubmitting ? (
                <span>Grading on server...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Submit & Check Answers</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

function varCssShadow(isSubmitted: boolean, isCorrect: boolean): string {
  if (!isSubmitted) return 'var(--shadow-sm)';
  return isCorrect
    ? '0 2px 8px rgba(16, 185, 129, 0.15)'
    : '0 2px 8px rgba(244, 63, 94, 0.15)';
}
