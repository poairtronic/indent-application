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
    'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 focus:ring-offset-blue-100 dark:focus:ring-offset-gray-800',
  secondary:
    'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 focus:ring-gray-400 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800',
  danger:
    'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 focus:ring-offset-red-100 dark:focus:ring-offset-gray-800',
  success:
    'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 focus:ring-offset-green-100 dark:focus:ring-offset-gray-800',
  warning:
    'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 focus:ring-offset-amber-100 dark:focus:ring-offset-gray-800',
  ghost:
    'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-gray-400',
  outline:
    'bg-transparent border border-border-default hover:bg-background-secondary text-text-primary focus:ring-accent-primary',
  link: 'bg-transparent hover:underline text-accent-primary p-0 h-auto focus:ring-0',
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
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
        fab ? 'rounded-full p-3 shadow-lg' : `rounded-md ${sizeClasses[size]}`
      } ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" /> : icon}
      {(!fab || children) && children}
    </button>
  );
};
