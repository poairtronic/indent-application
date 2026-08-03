import React, { forwardRef } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full font-sans">
        {label && (
          <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full bg-background-primary border rounded-lg px-3 py-2 text-xs text-text-primary outline-none transition-all focus:ring-1 focus:ring-accent-primary focus:border-accent-primary disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[80px] ${
            error ? 'border-status-error' : 'border-border-default'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-[10px] text-status-error font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1 text-[10px] text-text-muted">{helperText}</p>}
      </div>
    );
  },
);

TextArea.displayName = 'TextArea';
