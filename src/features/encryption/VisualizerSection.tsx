import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Info,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { EncryptionResult, EncryptionStep } from './types';

interface VisualizerSectionProps {
  encryptionResult: EncryptionResult | null;
}

export const VisualizerSection: React.FC<VisualizerSectionProps> = ({
  encryptionResult,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps: EncryptionStep[] = encryptionResult?.steps || [];
  const currentStep = steps[activeStepIndex] || null;

  // Auto-play timer
  useEffect(() => {
    let timer: number | undefined;
    if (isPlaying && steps.length > 0) {
      timer = window.setInterval(() => {
        setActiveStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, steps.length]);

  if (!encryptionResult || steps.length === 0) {
    return (
      <div
        className="card"
        style={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-slate-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            color: 'var(--color-slate-400)',
          }}
        >
          <Info size={24} />
        </div>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--color-slate-800)', marginBottom: '0.5rem' }}>
          Encryption Flow Visualizer
        </h3>
        <p style={{ maxWidth: '440px', margin: '0 auto', fontSize: '0.875rem', color: 'var(--color-slate-500)' }}>
          Enter a message and encrypt it in the Encrypt tab to see the step-by-step conceptual transformation from plaintext to transport package.
        </p>
      </div>
    );
  }

  const handleNext = () => {
    setIsPlaying(false);
    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    }
  };

  const handlePrev = () => {
    setIsPlaying(false);
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setActiveStepIndex(0);
  };

  const togglePlay = () => {
    if (!isPlaying && activeStepIndex === steps.length - 1) {
      setActiveStepIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Accuracy Disclaimer */}
      <div
        style={{
          backgroundColor: 'var(--color-slate-100)',
          borderLeft: '4px solid var(--primary-600)',
          padding: '0.75rem 1rem',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          fontSize: '0.8rem',
          color: 'var(--color-slate-700)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.6rem',
        }}
      >
        <Info size={16} color="var(--primary-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Conceptual Architecture Notice:</strong> This diagram explains the conceptual data transformation flow (Plaintext → UTF-8 → AES-GCM + IV → Tag → Base64 Package). It does <em>not</em> claim to show AES’s internal mathematical rounds (SubBytes, ShiftRows, MixColumns).
        </span>
      </div>

      {/* Stepper Navigation Pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
        }}
      >
        {steps.map((step, idx) => {
          const isActive = idx === activeStepIndex;
          const isCompleted = idx < activeStepIndex;
          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStepIndex(idx);
                }}
                className="btn btn-sm"
                style={{
                  backgroundColor: isActive
                    ? 'var(--primary-700)'
                    : isCompleted
                    ? 'var(--color-slate-200)'
                    : '#ffffff',
                  color: isActive
                    ? '#ffffff'
                    : isCompleted
                    ? 'var(--color-slate-800)'
                    : 'var(--color-slate-600)',
                  border: isActive
                    ? '1px solid var(--primary-800)'
                    : '1px solid var(--color-slate-300)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.65rem',
                }}
              >
                <span>{idx + 1}. {step.title.split(':')[1]?.trim() || step.title}</span>
              </button>
              {idx < steps.length - 1 && (
                <ChevronRight size={14} color="var(--color-slate-400)" style={{ flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Main Active Step Display Card */}
      {currentStep && (
        <div
          className="card animate-fade-in"
          style={{
            borderTop: '4px solid var(--accent-600)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Header */}
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
            <div>
              <span className={`badge badge-${currentStep.accentColor}`} style={{ marginBottom: '0.35rem' }}>
                {currentStep.badge || `Stage ${activeStepIndex + 1} of ${steps.length}`}
              </span>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-slate-900)', fontWeight: 700 }}>
                {currentStep.title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>
                {currentStep.subtitle}
              </p>
            </div>

            {/* Stepper controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={togglePlay}
                className="btn btn-sm btn-outline"
                title={isPlaying ? 'Pause animation' : 'Auto play through steps'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'Pause' : 'Auto-Play'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn btn-sm btn-ghost"
                title="Reset to Step 1"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Explanation */}
          <p style={{ fontSize: '0.925rem', color: 'var(--color-slate-700)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            {currentStep.description}
          </p>

          {/* Data snippet preview */}
          {currentStep.dataSnippet && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-slate-500)', marginBottom: '0.35rem' }}>
                TRANSFORMED DATA AT THIS STAGE:
              </div>
              <div className="code-block" style={{ fontSize: '0.825rem' }}>
                {currentStep.dataSnippet}
              </div>
            </div>
          )}

          {/* Technical parameters table */}
          {currentStep.technicalDetails.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--color-slate-50)',
                border: '1px solid var(--color-slate-200)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '0.5rem 0.85rem', backgroundColor: 'var(--color-slate-100)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-slate-600)' }}>
                Cryptographic Parameters
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', padding: '0.75rem 0.85rem' }}>
                {currentStep.technicalDetails.map((detail, idx) => (
                  <div key={idx} style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--color-slate-500)', display: 'block' }}>{detail.label}:</span>
                    <strong style={{ color: 'var(--color-slate-800)', fontFamily: 'var(--font-mono)' }}>
                      {detail.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom navigation buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--color-slate-200)',
            }}
          >
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeStepIndex === 0}
              className="btn btn-sm btn-outline"
            >
              <ArrowLeft size={14} />
              <span>Previous Stage</span>
            </button>

            <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>
              Step {activeStepIndex + 1} of {steps.length}
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={activeStepIndex === steps.length - 1}
              className="btn btn-sm btn-primary"
            >
              <span>Next Stage</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

