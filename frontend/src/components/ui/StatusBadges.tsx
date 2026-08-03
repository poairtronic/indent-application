import React from 'react';

interface PriorityBadgeProps {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  className?: string;
}

const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
  LOW: {
    bg: 'bg-blue-500/10 border-blue-500/20',
    text: 'text-blue-500',
    label: 'Low',
  },
  MEDIUM: {
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'text-amber-500',
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
    bg: 'bg-gray-500/10 border-gray-500/20',
    text: 'text-gray-500',
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
    bg: 'bg-green-500/10 border-green-500/20',
    text: 'text-green-500',
    label: 'Low Risk',
  },
  MODERATE: {
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'text-amber-500',
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
    bg: 'bg-gray-500/10 border-gray-500/20',
    text: 'text-gray-500',
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
