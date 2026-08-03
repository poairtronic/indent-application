import React, { forwardRef } from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className = '', ...props }, ref) => {
    return (
      <div className="font-sans flex items-start gap-2.5">
        <input
          ref={ref}
          type="checkbox"
          className={`mt-0.5 h-4 w-4 rounded border bg-background-primary text-accent-primary focus:ring-accent-primary outline-none transition-all cursor-pointer ${
            error ? 'border-status-error' : 'border-border-default'
          } ${className}`}
          {...props}
        />
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-text-primary select-none cursor-pointer">
            {label}
          </label>
          {description && <p className="text-[10px] text-text-muted mt-0.5">{description}</p>}
          {error && <p className="mt-1 text-[10px] text-status-error font-medium">{error}</p>}
        </div>
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';
