import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeVal = size === 'sm' ? 16 : size === 'lg' ? 32 : 24;
  return (
    <Loader2 size={sizeVal} className={`animate-spin text-accent-primary shrink-0 ${className}`} />
  );
};

interface ProgressProps {
  value: number;
  className?: string;
}

export const LinearProgress: React.FC<ProgressProps> = ({ value, className = '' }) => {
  const normVal = Math.min(100, Math.max(0, value));
  return (
    <div className={`w-full h-1.5 bg-background-primary rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-accent-primary transition-all duration-300"
        style={{ width: `${normVal}%` }}
      />
    </div>
  );
};

export const CircularProgress: React.FC<
  ProgressProps & { size?: number; strokeWidth?: number }
> = ({ value, size = 32, strokeWidth = 3, className = '' }) => {
  const normVal = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normVal / 100) * circumference;

  return (
    <div className={`inline-flex relative ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-border-default fill-transparent"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-accent-primary fill-transparent transition-all duration-300"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export const PageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-background-primary/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3 font-sans">
      <Spinner size="lg" />
      <span className="text-xs font-bold text-text-secondary animate-pulse uppercase tracking-widest">
        Loading System Panel...
      </span>
    </div>
  );
};

export const InlineLoader: React.FC<{ label?: string }> = ({ label = 'Fetching records...' }) => {
  return (
    <div className="flex items-center justify-center gap-2 py-8 font-sans text-xs text-text-muted">
      <Spinner size="sm" />
      <span>{label}</span>
    </div>
  );
};
