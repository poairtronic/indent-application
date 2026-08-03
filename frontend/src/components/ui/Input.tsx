import React, { forwardRef, useState, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, type = 'text', className = '', id, ...props }, ref) => {
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
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            className={`w-full bg-background-primary border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled outline-none transition-all duration-150 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/25 disabled:opacity-50 disabled:cursor-not-allowed ${
              error ? 'border-status-error focus:ring-status-error/25' : 'border-border-default'
            } ${isPassword ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute right-3 top-2 text-text-muted hover:text-text-primary p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
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
