import React, { forwardRef, useState, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      startIcon,
      showPasswordToggle = true,
      type = 'text',
      className = '',
      id,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const describedBy =
      [error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full font-sans">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-3.5 z-10 flex items-center pointer-events-none text-text-muted dark:text-gray-400">
              {startIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            className={`w-full bg-background-primary border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled outline-none transition-all duration-150 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/25 disabled:opacity-50 disabled:cursor-not-allowed ${
              error ? 'border-status-error focus:ring-status-error/25' : 'border-border-default'
            } ${startIcon ? 'pl-10' : ''} ${isPassword && showPasswordToggle ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute right-3.5 z-10 text-text-muted hover:text-text-primary dark:text-gray-400 dark:hover:text-white p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary cursor-pointer transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            aria-live="polite"
            className="mt-1 text-[10px] text-status-error font-medium"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-[10px] text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
