import React from 'react';
import { CIPHER_COMPARISON_DATA } from './lessonData';
import { Boxes, Radio } from 'lucide-react';

export const ComparisonTable: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--color-slate-200)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--color-slate-50)',
          borderBottom: '1px solid var(--color-slate-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            Block Ciphers vs. Stream Ciphers Comparison
          </h3>
          <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-slate-600)' }}>
            The two primary operational categories of symmetric encryption algorithms
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge badge-indigo">
            <Boxes size={12} style={{ marginRight: '4px' }} /> Block (e.g. AES)
          </span>
          <span className="badge badge-teal">
            <Radio size={12} style={{ marginRight: '4px' }} /> Stream (e.g. ChaCha20)
          </span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.875rem',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#ffffff', borderBottom: '2px solid var(--color-slate-200)' }}>
              <th style={{ padding: '0.875rem 1.25rem', color: 'var(--color-slate-700)', fontWeight: 700, width: '25%' }}>
                Feature / Property
              </th>
              <th style={{ padding: '0.875rem 1.25rem', color: 'var(--primary-800)', backgroundColor: 'var(--primary-50)', fontWeight: 700, width: '37.5%' }}>
                Block Ciphers (AES)
              </th>
              <th style={{ padding: '0.875rem 1.25rem', color: 'var(--accent-700)', backgroundColor: 'var(--accent-50)', fontWeight: 700, width: '37.5%' }}>
                Stream Ciphers (ChaCha20)
              </th>
            </tr>
          </thead>
          <tbody>
            {CIPHER_COMPARISON_DATA.map((item, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid var(--color-slate-200)',
                  backgroundColor: idx % 2 === 0 ? '#ffffff' : 'var(--color-slate-50)',
                }}
              >
                <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-slate-800)' }}>
                  {item.feature}
                  <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-slate-500)', marginTop: '0.2rem' }}>
                    {item.explanation}
                  </div>
                </td>
                <td style={{ padding: '1rem 1.25rem', color: 'var(--color-slate-800)', borderLeft: '1px solid var(--color-slate-200)' }}>
                  {item.blockCipher}
                </td>
                <td style={{ padding: '1rem 1.25rem', color: 'var(--color-slate-800)', borderLeft: '1px solid var(--color-slate-200)' }}>
                  {item.streamCipher}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

