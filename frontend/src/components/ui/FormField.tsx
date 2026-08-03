import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}) => {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5"
      >
        {label} {required && <span className="text-status-error">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-status-error">{error}</p>}
    </div>
  );
};
