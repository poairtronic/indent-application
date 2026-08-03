import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: number | string;
    isPositive: boolean;
  };
  loading?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  trend,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-surface-card border border-border-default rounded-xl p-6 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 bg-surface-elevated rounded w-24"></div>
          <div className="h-8 w-8 bg-surface-elevated rounded-lg"></div>
        </div>
        <div className="h-8 bg-surface-elevated rounded w-16 mb-2"></div>
        <div className="h-3 bg-surface-elevated rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-border-default hover:border-border-strong transition-all rounded-xl p-6 shadow-card group">
      <div className="flex justify-between items-start mb-3">
        <span className="text-text-muted text-sm font-semibold tracking-wide uppercase">
          {title}
        </span>
        {icon && (
          <div className="p-2 bg-surface-elevated rounded-lg text-accent-primary group-hover:text-accent-light transition-colors">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-text-primary tracking-tight">{value}</span>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-status-success/10 text-status-success border border-status-success/20'
                : 'bg-status-error/10 text-status-error border border-status-error/20'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="text-text-muted text-xs mt-1">{subtitle}</p>}
    </div>
  );
};
