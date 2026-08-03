import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password = '',
}) => {
  const analysis = useMemo(() => {
    const checks = {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*?&]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;

    let label: string;
    let colorClass: string;
    let textClass: string;

    if (score === 0 || password.length === 0) {
      label = 'None';
      colorClass = 'bg-border-default';
      textClass = 'text-text-muted';
    } else if (score <= 2) {
      label = 'Weak';
      colorClass = 'bg-status-error';
      textClass = 'text-status-error';
    } else if (score <= 4) {
      label = 'Fair';
      colorClass = 'bg-status-warning';
      textClass = 'text-status-warning';
    } else {
      label = 'Strong';
      colorClass = 'bg-status-success';
      textClass = 'text-status-success';
    }

    return { checks, score, label, colorClass, textClass };
  }, [password]);

  if (!password) return null;

  return (
    <div
      className="mt-2.5 space-y-2 font-sans text-xs"
      role="region"
      aria-label="Password Strength"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
          Password Strength:
        </span>
        <span className={`text-[11px] font-bold ${analysis.textClass}`}>{analysis.label}</span>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full rounded-full transition-all duration-300 ${
              analysis.score >= step * 1.25 ? analysis.colorClass : 'bg-border-default/40'
            }`}
          />
        ))}
      </div>

      {/* Requirement List */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-1">
        <div
          className={`flex items-center gap-1 ${
            analysis.checks.minLength ? 'text-status-success' : 'text-text-muted'
          }`}
        >
          {analysis.checks.minLength ? <Check size={12} /> : <X size={12} />}
          <span>At least 8 chars</span>
        </div>
        <div
          className={`flex items-center gap-1 ${
            analysis.checks.hasUpper ? 'text-status-success' : 'text-text-muted'
          }`}
        >
          {analysis.checks.hasUpper ? <Check size={12} /> : <X size={12} />}
          <span>Uppercase letter</span>
        </div>
        <div
          className={`flex items-center gap-1 ${
            analysis.checks.hasLower ? 'text-status-success' : 'text-text-muted'
          }`}
        >
          {analysis.checks.hasLower ? <Check size={12} /> : <X size={12} />}
          <span>Lowercase letter</span>
        </div>
        <div
          className={`flex items-center gap-1 ${
            analysis.checks.hasNumber ? 'text-status-success' : 'text-text-muted'
          }`}
        >
          {analysis.checks.hasNumber ? <Check size={12} /> : <X size={12} />}
          <span>Number (0-9)</span>
        </div>
        <div
          className={`flex items-center gap-1 ${
            analysis.checks.hasSpecial ? 'text-status-success' : 'text-text-muted'
          }`}
        >
          {analysis.checks.hasSpecial ? <Check size={12} /> : <X size={12} />}
          <span>Special (@$!%*?&)</span>
        </div>
      </div>
    </div>
  );
};
