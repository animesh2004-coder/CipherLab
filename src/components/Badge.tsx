import React from 'react';

export type BadgeVariant = 'slate' | 'indigo' | 'teal' | 'emerald' | 'amber' | 'violet' | 'blue' | 'rose';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  className = '',
  icon,
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      {children}
    </span>
  );
};

