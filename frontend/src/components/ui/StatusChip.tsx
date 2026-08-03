import React from 'react';

interface StatusChipProps {
  status: string;
  className?: string;
}

const statusColorMap: Record<string, { bg: string; text: string; label: string }> = {
  // Loop 1 Manufacturing Workflow
  DRAFT: {
    bg: 'bg-background-secondary',
    text: 'text-text-secondary',
    label: 'Draft',
  },
  DESIGN_COMPLETED: {
    bg: 'bg-accent-primary/10',
    text: 'text-accent-primary',
    label: 'Design Completed',
  },
  STORES_PROCESSING: {
    bg: 'bg-status-warning/12',
    text: 'text-status-warning',
    label: 'Stores Processing',
  },
  PRODUCTION_PROCESSING: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    label: 'Production',
  },
  CUSTOMER_DELIVERED: {
    bg: 'bg-status-success/12',
    text: 'text-status-success',
    label: 'Customer Delivered',
  },

  // Loop 2 Finance Workflow
  ACCOUNTS_COST_VERIFICATION: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    label: 'Cost Verification',
  },
  ACCOUNTS_FINANCIAL_CLOSURE: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    label: 'Financial Closure',
  },
  ARCHIVED: {
    bg: 'bg-status-error/10',
    text: 'text-status-error',
    label: 'Archived',
  },
  COMPLETED: {
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    label: 'Completed',
  },
};

export const StatusChip: React.FC<StatusChipProps> = ({ status, className = '' }) => {
  const normKey = status.toUpperCase();
  const cfg = statusColorMap[normKey] || {
    bg: 'bg-background-secondary',
    text: 'text-text-secondary',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${cfg.bg} ${cfg.text} ${className}`}
    >
      <span className="w-1 h-1 rounded-full bg-current mr-1.5" />
      {cfg.label}
    </span>
  );
};
