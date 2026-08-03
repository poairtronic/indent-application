import React, { forwardRef, useId } from 'react';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, className = '', id, checked, defaultChecked, ...props }, ref) => {
    const generatedId = useId();
    const switchId = id || generatedId;
    const descId = `${switchId}-desc`;

    return (
      <div className="font-sans flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <label
            htmlFor={switchId}
            className="text-xs font-semibold text-text-primary select-none cursor-pointer"
          >
            {label}
          </label>
          {description && (
            <p id={descId} className="text-[10px] text-text-muted mt-0.5">
              {description}
            </p>
          )}
        </div>
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            ref={ref}
            id={switchId}
            type="checkbox"
            role="switch"
            aria-checked={checked ?? defaultChecked ?? false}
            aria-describedby={description ? descId : undefined}
            className={`sr-only peer ${className}`}
            checked={checked}
            defaultChecked={defaultChecked}
            {...props}
          />
          <div className="w-9 h-5 bg-background-primary border border-border-default rounded-full peer peer-focus-visible:ring-2 peer-focus-visible:ring-accent-primary peer-focus-visible:ring-offset-2 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-muted peer-checked:after:bg-white after:border-border-default after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-primary peer-checked:border-accent-primary shadow-[var(--shadow-inset)]" />
        </label>
      </div>
    );
  },
);

Switch.displayName = 'Switch';
