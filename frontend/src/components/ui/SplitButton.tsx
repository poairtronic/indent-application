import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, type ButtonVariant, type ButtonSize } from './Button';

interface SplitButtonOption {
  label: string;
  onClick: () => void;
}

interface SplitButtonProps {
  label: string;
  onClick: () => void;
  options: SplitButtonOption[];
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
}

export const SplitButton: React.FC<SplitButtonProps> = ({
  label,
  onClick,
  options,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-flex font-sans ${className}`}>
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={onClick}
        className="rounded-r-none border-r border-black/10 dark:border-white/10"
      >
        {label}
      </Button>

      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-l-none px-2"
        aria-expanded={isOpen}
      >
        <ChevronDown size={14} />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-44 bg-surface-card border border-border-default rounded-lg shadow-lg py-1 z-20 text-xs font-medium">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  opt.onClick();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-text-primary hover:bg-background-secondary transition-colors focus:outline-none"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
