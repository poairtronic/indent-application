import React from 'react';
import { AlertCircle, RotateCcw, ShieldAlert, FileQuestion, ServerCrash } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  code?: 403 | 404 | 500;
}

const errorConfig = {
  403: {
    icon: <ShieldAlert size={24} className="text-status-error" />,
    title: 'Access Denied (403)',
    desc: 'You do not have authorization credentials to view this endpoint.',
  },
  404: {
    icon: <FileQuestion size={24} className="text-text-muted" />,
    title: 'Record Not Found (404)',
    desc: 'The requested resource or page could not be located.',
  },
  500: {
    icon: <ServerCrash size={24} className="text-status-error" />,
    title: 'Internal Server Error (500)',
    desc: 'A critical server-side exception occurred. Please try again or alert admin.',
  },
};

export const ErrorState: React.FC<ErrorStateProps> = ({ title, message, onRetry, code }) => {
  const config = code ? errorConfig[code] : null;
  const displayTitle = title || config?.title || 'Unable to load data';
  const displayDesc =
    message || config?.desc || 'An unexpected error occurred while fetching data.';
  const displayIcon = config?.icon || <AlertCircle size={24} className="text-status-error" />;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center font-sans">
      <div className="w-14 h-14 rounded-full bg-background-secondary border border-border-default flex items-center justify-center mb-4">
        {displayIcon}
      </div>
      <h3 className="text-sm font-bold text-text-primary">{displayTitle}</h3>
      <p className="text-xs text-text-muted mt-1.5 max-w-sm">{displayDesc}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          icon={<RotateCcw size={14} />}
          onClick={onRetry}
          className="mt-4"
        >
          Retry
        </Button>
      )}
    </div>
  );
};
