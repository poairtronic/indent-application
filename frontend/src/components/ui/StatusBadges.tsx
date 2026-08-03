import React from 'react';

interface PriorityBadgeProps {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  className?: string;
}

const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
  LOW: {
    bg: 'bg-info/10 border-info/20',
    text: 'text-info',
    label: 'Low',
  },
  MEDIUM: {
    bg: 'bg-status-warning/10 border-status-warning/20',
    text: 'text-status-warning',
    label: 'Medium',
  },
  HIGH: {
    bg: 'bg-status-error/10 border-status-error/20',
    text: 'text-status-error',
    label: 'High',
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const key = priority.toUpperCase();
  const cfg = priorityConfig[key] || {
    bg: 'bg-text-disabled/10 border-text-disabled/20',
    text: 'text-text-disabled',
    label: priority,
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text} ${className}`}
    >
      {cfg.label}
    </span>
  );
};

interface RiskBadgeProps {
  risk: 'LOW' | 'MODERATE' | 'CRITICAL' | string;
  className?: string;
}

const riskConfig: Record<string, { bg: string; text: string; label: string }> = {
  LOW: {
    bg: 'bg-status-success/10 border-status-success/20',
    text: 'text-status-success',
    label: 'Low Risk',
  },
  MODERATE: {
    bg: 'bg-status-warning/10 border-status-warning/20',
    text: 'text-status-warning',
    label: 'Moderate Risk',
  },
  CRITICAL: {
    bg: 'bg-status-error/10 border-status-error/20',
    text: 'text-status-error',
    label: 'Critical Risk',
  },
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, className = '' }) => {
  const key = risk.toUpperCase();
  const cfg = riskConfig[key] || {
    bg: 'bg-text-disabled/10 border-text-disabled/20',
    text: 'text-text-disabled',
    label: risk,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text} ${className}`}
    >
      {cfg.label}
    </span>
  );
};
