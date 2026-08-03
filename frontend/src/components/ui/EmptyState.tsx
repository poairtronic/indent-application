import React from 'react';
import { Inbox, Search, ShieldAlert, WifiOff } from 'lucide-react';

export type EmptyStateVariant =
  'no-data' | 'no-results' | 'no-permission' | 'offline' | 'search-empty';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: EmptyStateVariant;
}

const variantConfig: Record<
  EmptyStateVariant,
  { icon: React.ReactNode; title: string; desc: string }
> = {
  'no-data': {
    icon: <Inbox size={24} className="text-text-muted" />,
    title: 'No data available',
    desc: 'No records exist in the repository yet.',
  },
  'no-results': {
    icon: <Search size={24} className="text-text-muted" />,
    title: 'No results found',
    desc: 'No matching items match your active filters.',
  },
  'no-permission': {
    icon: <ShieldAlert size={24} className="text-status-error" />,
    title: 'Access denied',
    desc: 'You do not have the required role to view this data.',
  },
  offline: {
    icon: <WifiOff size={24} className="text-text-muted" />,
    title: 'Network offline',
    desc: 'Please verify your internet connection.',
  },
  'search-empty': {
    icon: <Search size={24} className="text-text-muted" />,
    title: 'Search results empty',
    desc: 'Try checking for spelling or refine search terms.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  variant = 'no-data',
}) => {
  const config = variantConfig[variant];
  const displayTitle = title || config.title;
  const displayDesc = description || config.desc;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center font-sans">
      <div className="w-14 h-14 rounded-full bg-background-secondary border border-border-default flex items-center justify-center mb-4">
        {config.icon}
      </div>
      <h3 className="text-sm font-bold text-text-primary">{displayTitle}</h3>
      <p className="text-xs text-text-muted mt-1.5 max-w-sm">{displayDesc}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
