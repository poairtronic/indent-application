import React, { forwardRef } from 'react';

interface RadioOption {
  label: string;
  value: string;
  description?: string;
}

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  options: RadioOption[];
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, options, name, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full font-sans">
        {label && (
          <label className="block text-xs font-semibold text-text-secondary mb-2.5 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="space-y-3">
          {options.map((opt) => (
            <div key={opt.value} className="flex items-start gap-2.5">
              <input
                ref={ref}
                type="radio"
                name={name}
                value={opt.value}
                className={`mt-0.5 h-4 w-4 bg-background-primary text-accent-primary focus:ring-accent-primary outline-none cursor-pointer ${className}`}
                {...props}
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-primary">{opt.label}</span>
                {opt.description && (
                  <span className="text-[10px] text-text-muted mt-0.5">{opt.description}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {error && <p className="mt-1.5 text-[10px] text-status-error font-medium">{error}</p>}
      </div>
    );
  },
);

Radio.displayName = 'Radio';
