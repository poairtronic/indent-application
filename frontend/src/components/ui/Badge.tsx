import React from 'react';
import type { UserStatus } from '../../types/user';

export type BadgeTone = 'green' | 'yellow' | 'red' | 'gray' | 'blue';

const toneClasses: Record<BadgeTone, string> = {
  green: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
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
