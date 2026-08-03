import React, { useRef, useId } from 'react';

interface OtpInputProps {
  label?: string;
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  label = 'Enter verification code',
  length = 6,
  value,
  onChange,
  error,
  className = '',
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const generatedId = useId();
  const baseId = `otp-${generatedId}`;
  const errorId = `${baseId}-error`;

  const getDigitsArray = () => {
    const arr = value.split('');
    while (arr.length < length) arr.push('');
    return arr.slice(0, length);
  };

  const currentDigits = getDigitsArray();

  const handleInputChange = (idx: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const newDigits = [...currentDigits];

    newDigits[idx] = cleanVal.slice(-1);

    const combined = newDigits.join('');
    onChange(combined);

    if (newDigits[idx] && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!currentDigits[idx] && idx > 0) {
        inputsRef.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      if (idx > 0) {
        inputsRef.current[idx - 1]?.focus();
        e.preventDefault();
      }
    } else if (e.key === 'ArrowRight') {
      if (idx < length - 1) {
        inputsRef.current[idx + 1]?.focus();
        e.preventDefault();
      }
    }
  };

  return (
    <div className={`w-full font-sans text-xs ${className}`}>
      {label && (
        <label
          htmlFor={`${baseId}-0`}
          className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide"
        >
          {label}
        </label>
      )}
      <div className="flex items-center gap-2 justify-between">
        {Array.from({ length }).map((_, idx) => (
          <input
            key={idx}
            id={`${baseId}-${idx}`}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={currentDigits[idx] || ''}
            onChange={(e) => handleInputChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            aria-label={`Digit ${idx + 1} of ${length}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
            className={`w-10 h-10 bg-background-primary border rounded-lg text-center text-sm font-bold text-text-primary outline-none transition-all focus:ring-1 focus:ring-accent-primary focus:border-accent-primary disabled:opacity-50 disabled:cursor-not-allowed ${
              error ? 'border-status-error' : 'border-border-default'
            }`}
          />
        ))}
      </div>
      {error && (
        <p
          id={errorId}
          aria-live="polite"
          className="mt-1.5 text-[10px] text-status-error font-medium"
        >
          {error}
        </p>
      )}
    </div>
  );
};
