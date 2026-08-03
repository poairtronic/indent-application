import React, { forwardRef, useId } from 'react';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const describedBy =
      [error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full font-sans">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          className={`w-full bg-background-primary border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled outline-none transition-all duration-150 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/25 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-status-error focus:ring-status-error/25' : 'border-border-default'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select';
