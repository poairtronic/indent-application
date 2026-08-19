import React from 'react';
import type { UserStatus } from '../../types/user';

export type BadgeTone = 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

const toneClasses: Record<BadgeTone, string> = {
  green: 'bg-status-success/12 text-status-success border border-status-success/20',
  yellow: 'bg-status-warning/12 text-status-warning border border-status-warning/20',
  red: 'bg-status-error/12 text-status-error border border-status-error/20',
  gray: 'bg-background-secondary text-text-secondary border border-border-default',
  blue: 'bg-accent-primary/12 text-accent-primary border border-accent-primary/20',
  info: 'bg-info/12 text-info border border-info/20',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-xs',
};

interface BadgeProps {
  tone?: BadgeTone;
  size?: BadgeSize;
  className?: string;
  count?: boolean;
  dot?: boolean;
  dotColor?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  tone = 'gray',
  size = 'md',
  className = '',
  count = false,
  dot = false,
  dotColor,
  icon,
  children,
}) => {
  if (dot) {
    const colorClass = dotColor || 'bg-status-error';
    return (
      <span
        className={`inline-block w-2 h-2 rounded-full ${colorClass} ${className}`}
        role="status"
        aria-label={typeof children === 'string' ? children : undefined}
      />
    );
  }

  if (count) {
    return (
      <span
        className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-status-error text-white ${className}`}
        role="status"
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${toneClasses[tone]} ${className}`}
      role="status"
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

// --- Status Mappings ---

export const statusTone: Record<UserStatus, BadgeTone> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  SUSPENDED: 'red',
};

export const statusLabel: Record<UserStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
};

// --- Workflow StatusChip ---

interface StatusChipProps {
  status: string;
  size?: BadgeSize;
  className?: string;
}

const workflowStatusMap: Record<string, { tone: BadgeTone; label: string }> = {
  DRAFT: { tone: 'gray', label: 'Draft' },
  DESIGN_COMPLETED: { tone: 'blue', label: 'Design Completed' },
  STORES_PROCESSING: { tone: 'yellow', label: 'Stores Processing' },
  PRODUCTION_PROCESSING: { tone: 'blue', label: 'Production' },
  ACCOUNTS_COST_VERIFICATION: { tone: 'info', label: 'Cost Verification' },
  ACCOUNTS_FINANCIAL_CLOSURE: { tone: 'green', label: 'Financial Closure' },
  ARCHIVED: { tone: 'red', label: 'Archived' },
  COMPLETED: { tone: 'green', label: 'Completed' },
};

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'sm', className = '' }) => {
  const key = status.toUpperCase();
  const cfg = workflowStatusMap[key] || { tone: 'gray' as BadgeTone, label: status };

  return (
    <Badge tone={cfg.tone} size={size} className={className}>
      <span className="w-1 h-1 rounded-full bg-current" />
      {cfg.label}
    </Badge>
  );
};

// --- Priority Badge ---

interface PriorityBadgeProps {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  size?: BadgeSize;
  className?: string;
}

const priorityToneMap: Record<string, BadgeTone> = {
  LOW: 'info',
  MEDIUM: 'yellow',
  HIGH: 'red',
};

const priorityLabelMap: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'sm',
  className = '',
}) => {
  const key = priority.toUpperCase();
  const tone = priorityToneMap[key] || 'gray';
  const label = priorityLabelMap[key] || priority;

  return (
    <Badge tone={tone} size={size} className={`font-bold uppercase tracking-wider ${className}`}>
      {label}
    </Badge>
  );
};

// --- Risk Badge ---

interface RiskBadgeProps {
  risk: 'LOW' | 'MODERATE' | 'CRITICAL' | string;
  size?: BadgeSize;
  className?: string;
}

const riskToneMap: Record<string, BadgeTone> = {
  LOW: 'green',
  MODERATE: 'yellow',
  CRITICAL: 'red',
};

const riskLabelMap: Record<string, string> = {
  LOW: 'Low Risk',
  MODERATE: 'Moderate Risk',
  CRITICAL: 'Critical Risk',
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, size = 'sm', className = '' }) => {
  const key = risk.toUpperCase();
  const tone = riskToneMap[key] || 'gray';
  const label = riskLabelMap[key] || risk;

  return (
    <Badge tone={tone} size={size} className={`font-bold uppercase tracking-wider ${className}`}>
      {label}
    </Badge>
  );
};
