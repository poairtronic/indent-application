import React, { forwardRef, useId } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const describedBy =
      [error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full font-sans">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          className={`w-full bg-background-primary border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled outline-none transition-all duration-150 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/25 disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[80px] ${
            error ? 'border-status-error focus:ring-status-error/25' : 'border-border-default'
          } ${className}`}
          {...props}
        />
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

TextArea.displayName = 'TextArea';
