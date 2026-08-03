import React from 'react';
import * as Lucide from 'lucide-react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const alertStyles: Record<AlertType, { wrapper: string; text: string; icon: React.ReactNode }> = {
  info: {
    wrapper: 'bg-accent-primary/10 border-accent-primary/20 text-text-primary',
    text: 'text-accent-primary',
    icon: <Lucide.Info className="w-4 h-4 shrink-0" />,
  },
  success: {
    wrapper: 'bg-green-500/10 border-green-500/20 text-text-primary',
    text: 'text-green-500',
    icon: <Lucide.CheckCircle className="w-4 h-4 shrink-0" />,
  },
  warning: {
    wrapper: 'bg-amber-500/10 border-amber-500/20 text-text-primary',
    text: 'text-amber-500',
    icon: <Lucide.AlertTriangle className="w-4 h-4 shrink-0" />,
  },
  error: {
    wrapper: 'bg-status-error/10 border-status-error/20 text-text-primary',
    text: 'text-status-error',
    icon: <Lucide.XCircle className="w-4 h-4 shrink-0" />,
  },
};

export const Alert: React.FC<AlertProps> = ({ type = 'info', title, children, className = '' }) => {
  const styles = alertStyles[type];

  return (
    <div
      className={`p-4 border rounded-xl flex gap-3 font-sans text-xs ${styles.wrapper} ${className}`}
      role="alert"
    >
      <span className={styles.text}>{styles.icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-bold mb-1">{title}</p>}
        <div className="text-text-secondary whitespace-pre-wrap">{children}</div>
      </div>
    </div>
  );
};
