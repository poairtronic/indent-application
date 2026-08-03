import React from 'react';

interface StatusChipProps {
  status: string;
  className?: string;
}

const statusColorMap: Record<string, { bg: string; text: string; label: string }> = {
  // Loop 1 Manufacturing Workflow
  DRAFT: {
    bg: 'bg-gray-150 dark:bg-gray-800/40',
    text: 'text-gray-600 dark:text-gray-400',
    label: 'Draft',
  },
  DESIGN_COMPLETED: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    label: 'Design Completed',
  },
  STORES_PROCESSING: {
    bg: 'bg-amber-100 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    label: 'Stores Processing',
  },
  PRODUCTION_PROCESSING: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    label: 'Production',
  },
  CUSTOMER_DELIVERED: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    label: 'Customer Delivered',
  },

  // Loop 2 Finance Workflow
  ACCOUNTS_COST_VERIFICATION: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    label: 'Cost Verification',
  },
  ACCOUNTS_FINANCIAL_CLOSURE: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'Financial Closure',
  },
  ARCHIVED: {
    bg: 'bg-rose-100 dark:bg-rose-900/20',
    text: 'text-rose-600 dark:text-rose-400',
    label: 'Archived',
  },
  COMPLETED: {
    bg: 'bg-teal-100 dark:bg-teal-900/20',
    text: 'text-teal-600 dark:text-teal-400',
    label: 'Completed',
  },
};

export const StatusChip: React.FC<StatusChipProps> = ({ status, className = '' }) => {
  const normKey = status.toUpperCase();
  const cfg = statusColorMap[normKey] || {
    bg: 'bg-gray-150 dark:bg-gray-800/40',
    text: 'text-gray-600 dark:text-gray-400',
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
