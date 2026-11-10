import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { isWebCryptoSupported } from '../features/encryption/cryptoService';

export const WebCryptoNotice: React.FC = () => {
  const check = isWebCryptoSupported();

  if (check.supported) {
    return null;
  }

  return (
    <div
      role="alert"
      className="alert alert-error"
      style={{
        margin: '1.5rem auto',
        maxWidth: '1120px',
        display: 'flex',
        alignItems: 'flex-start',
      }}
    >
      <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
          Web Crypto API Unavailable
        </strong>
        <p style={{ margin: 0 }}>
          {check.reason ||
            'Your browser or current connection environment does not support the Web Crypto API. Encryption actions have been disabled.'}
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
          Ensure you are accessing CipherLab via <code>http://localhost</code> or an HTTPS origin.
        </p>
      </div>
    </div>
  );
};

