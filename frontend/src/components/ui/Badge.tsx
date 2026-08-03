import React from 'react';
import type { UserStatus } from '../../types/user';

export type BadgeTone = 'green' | 'yellow' | 'red' | 'gray' | 'blue';

const toneClasses: Record<BadgeTone, string> = {
  green: 'bg-status-success/12 text-status-success',
  yellow: 'bg-status-warning/12 text-status-warning',
  red: 'bg-status-error/12 text-status-error',
  gray: 'bg-background-secondary text-text-secondary',
  blue: 'bg-accent-primary/12 text-accent-primary',
};

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  count?: boolean;
  dot?: boolean;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  tone = 'gray',
  className = '',
  count = false,
  dot = false,
  children,
}) => {
  if (dot) {
    return <span className={`inline-block w-2 h-2 rounded-full bg-status-error ${className}`} />;
  }

  if (count) {
    return (
      <span
        className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-status-error text-white ${className}`}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

export const statusTone: Record<UserStatus, BadgeTone> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  SUSPENDED: 'red',
};

export const statusLabel: Record<UserStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
};
