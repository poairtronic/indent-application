import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fab?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-primary hover:bg-accent-hover active:bg-accent-pressed text-white shadow-card hover:shadow-glow focus-visible:ring-accent-primary/40',
  secondary:
    'bg-background-secondary hover:bg-surface-elevated text-text-primary border border-border-default active:bg-background-secondary hover:border-border-strong focus-visible:ring-accent-primary/30',
  danger:
    'bg-status-error hover:bg-status-error/90 active:bg-status-error/80 text-white shadow-card hover:shadow-dropdown focus-visible:ring-status-error/40',
  success:
    'bg-status-success hover:bg-status-success/90 active:bg-status-success/80 text-white shadow-card hover:shadow-dropdown focus-visible:ring-status-success/40',
  warning:
    'bg-status-warning hover:bg-status-warning/90 active:bg-status-warning/80 text-white shadow-card hover:shadow-dropdown focus-visible:ring-status-warning/40',
  ghost:
    'bg-transparent hover:bg-background-secondary active:bg-surface-elevated text-text-secondary hover:text-text-primary focus-visible:ring-accent-primary/30',
  outline:
    'bg-transparent border border-border-default hover:border-border-strong hover:bg-background-secondary text-text-primary focus-visible:ring-accent-primary/30',
  link: 'bg-transparent hover:underline text-accent-primary hover:text-accent-hover p-0 h-auto focus-visible:ring-0',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-sm rounded-xl',
  xl: 'px-6 py-3 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fab = false,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...rest
    },
    ref,
  ) => {
    const iconSize = size === 'sm' ? 14 : size === 'lg' || size === 'xl' ? 18 : 16;

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-enter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-[0.98] ${
          fab ? 'rounded-full p-3 shadow-modal hover:shadow-glow' : `${sizeClasses[size]}`
        } ${fullWidth ? 'w-full' : ''} ${variantClasses[variant]} ${className}`}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        {...rest}
      >
        {loading ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : icon && iconPosition === 'left' ? (
          icon
        ) : null}
        {(!fab || children) && children}
        {!loading && icon && iconPosition === 'right' ? icon : null}
      </button>
    );
  },
);

Button.displayName = 'Button';
