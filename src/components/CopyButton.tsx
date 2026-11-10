import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  successLabel?: string;
  className?: string;
  title?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  label = 'Copy',
  successLabel = 'Copied!',
  className = '',
  title = 'Copy to clipboard',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!textToCopy) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for non-secure contexts
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn btn-sm ${copied ? 'btn-teal' : 'btn-outline'} ${className}`}
      title={title}
      aria-label={copied ? successLabel : label}
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span>{copied ? successLabel : label}</span>
    </button>
  );
};

