import React from 'react';

interface FormContainerProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <form className={`space-y-6 ${className}`} {...props}>
      {children}
    </form>
  );
};

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div
      className={`space-y-4 border border-border-default rounded-xl p-5 bg-surface-card font-sans ${className}`}
    >
      <div>
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">{title}</h4>
        {description && <p className="text-[10px] text-text-muted mt-1">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

interface FormGridProps {
  cols?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

const colClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

export const FormGrid: React.FC<FormGridProps> = ({ cols = 2, children, className = '' }) => {
  return <div className={`grid gap-4 ${colClasses[cols]} ${className}`}>{children}</div>;
};

export const FormRow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`flex flex-col md:flex-row gap-4 items-start ${className}`}>{children}</div>
  );
};

export const FormFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-end gap-3 pt-4 border-t border-border-default ${className}`}
    >
      {children}
    </div>
  );
};

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  label,
  required = false,
  error,
  helperText,
  children,
  className = '',
}) => {
  return (
    <div className={`w-full font-sans text-xs ${className}`}>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-status-error">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[10px] text-status-error font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-[10px] text-text-muted">{helperText}</p>}
    </div>
  );
};
