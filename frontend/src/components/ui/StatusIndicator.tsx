import React from 'react';

export type IndicatorState =
  'online' | 'offline' | 'success' | 'warning' | 'error' | 'pending' | 'archived';

interface StatusIndicatorProps {
  state: IndicatorState;
  label?: string;
  className?: string;
}

const indicatorConfig: Record<IndicatorState, { dot: string; glow: string; label: string }> = {
  online: {
    dot: 'bg-green-500',
    glow: 'bg-green-500/50',
    label: 'Online',
  },
  offline: {
    dot: 'bg-gray-400',
    glow: 'bg-gray-400/0',
    label: 'Offline',
  },
  success: {
    dot: 'bg-emerald-500',
    glow: 'bg-emerald-500/50',
    label: 'Success',
  },
  warning: {
    dot: 'bg-amber-500',
    glow: 'bg-amber-500/50',
    label: 'Warning',
  },
  error: {
    dot: 'bg-status-error',
    glow: 'bg-status-error/50',
    label: 'Error',
  },
  pending: {
    dot: 'bg-blue-500',
    glow: 'bg-blue-500/50',
    label: 'Pending',
  },
  archived: {
    dot: 'bg-indigo-500',
    glow: 'bg-indigo-500/50',
    label: 'Archived',
  },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  state,
  label,
  className = '',
}) => {
  const cfg = indicatorConfig[state];
  const displayLabel = label || cfg.label;

  return (
    <div className={`inline-flex items-center gap-2 font-sans text-xs font-semibold ${className}`}>
      <span className="relative flex h-2 w-2 select-none">
        {state !== 'offline' && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.glow}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
      </span>
      <span className="text-text-secondary">{displayLabel}</span>
    </div>
  );
};
