import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className = '',
}) => {
  const errorId = error ? `${htmlFor || 'field'}-error` : undefined;
  const hintId = hint && !error ? `${htmlFor || 'field'}-hint` : undefined;

  return (
    <div className={`w-full font-sans text-xs ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide"
      >
        {label} {required && <span className="text-status-error">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-status-error font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Alias for backward compatibility
export const FieldWrapper = FormField;
