import React, { forwardRef, useId } from 'react';

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  variant?: 'date' | 'time' | 'datetime' | 'month' | 'year' | 'range';
  error?: string;
  helperText?: string;
  valueEnd?: string;
  onChangeEnd?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  nameEnd?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      variant = 'date',
      error,
      helperText,
      className = '',
      valueEnd,
      onChangeEnd,
      nameEnd,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy =
      [error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(' ') || undefined;

    let inputType = 'date';
    if (variant === 'time') inputType = 'time';
    else if (variant === 'datetime') inputType = 'datetime-local';
    else if (variant === 'month') inputType = 'month';
    else if (variant === 'year') inputType = 'number';

    const baseInputStyle = `w-full bg-background-primary border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled outline-none transition-all duration-150 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/25 disabled:opacity-50 disabled:cursor-not-allowed ${
      error ? 'border-status-error focus:ring-status-error/25' : 'border-border-default'
    } ${className}`;

    if (variant === 'range') {
      const isStartReadOnly = props.readOnly || (!props.onChange && props.value !== undefined);
      const isEndReadOnly = props.readOnly || (!onChangeEnd && valueEnd !== undefined);

      return (
        <div className="w-full font-sans">
          {label && (
            <span className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
              {label}
            </span>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={ref}
              type="date"
              aria-label="Start date"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={describedBy}
              className={baseInputStyle}
              readOnly={isStartReadOnly}
              {...props}
            />
            <span className="text-text-muted text-xs font-semibold" aria-hidden="true">
              to
            </span>
            <input
              type="date"
              name={nameEnd}
              value={valueEnd ?? ''}
              onChange={onChangeEnd}
              readOnly={isEndReadOnly}
              aria-label="End date"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={describedBy}
              className={baseInputStyle}
            />
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
    }

    const isDefaultReadOnly = props.readOnly || (!props.onChange && props.value !== undefined);

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
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          className={baseInputStyle}
          readOnly={isDefaultReadOnly}
          {...(variant === 'year' ? { min: 1900, max: 2100, placeholder: 'YYYY' } : {})}
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

DatePicker.displayName = 'DatePicker';
