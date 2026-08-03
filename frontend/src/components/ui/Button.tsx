import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline' | 'link';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fab?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-primary hover:bg-accent-hover active:bg-accent-pressed text-white shadow-sm hover:shadow focus-visible:ring-accent-primary/40',
  secondary:
    'bg-background-secondary hover:bg-surface-elevated text-text-primary border border-border-default active:bg-background-secondary focus-visible:ring-accent-primary/30',
  danger:
    'bg-status-error hover:bg-status-error/90 active:bg-status-error/80 text-white shadow-sm hover:shadow focus-visible:ring-status-error/40',
  success:
    'bg-status-success hover:bg-status-success/90 active:bg-status-success/80 text-white shadow-sm hover:shadow focus-visible:ring-status-success/40',
  warning:
    'bg-status-warning hover:bg-status-warning/90 active:bg-status-warning/80 text-white shadow-sm hover:shadow focus-visible:ring-status-warning/40',
  ghost:
    'bg-transparent hover:bg-background-secondary active:bg-surface-elevated text-text-secondary hover:text-text-primary focus-visible:ring-accent-primary/30',
  outline:
    'bg-transparent border border-border-default hover:border-border-strong hover:bg-background-secondary text-text-primary focus-visible:ring-accent-primary/30',
  link: 'bg-transparent hover:underline text-accent-primary hover:text-accent-hover p-0 h-auto focus-visible:ring-0',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fab = false,
  children,
  className = '',
  disabled,
  ...rest
}) => {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] ${
        fab ? 'rounded-full p-3 shadow-lg' : `${sizeClasses[size]}`
      } ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" /> : icon}
      {(!fab || children) && children}
    </button>
  );
};
