import React from 'react';

type AccentTone = 'primary' | 'info' | 'success' | 'warning' | 'danger';

const ACCENT_CONFIG: Record<
  AccentTone,
  { line: string; icon: string; aura: string; value: string }
> = {
  primary: {
    line: 'kpi-line-primary',
    icon: 'kpi-icon-primary',
    aura: 'kpi-aura-primary',
    value: 'bg-grad-primary',
  },
  info: {
    line: 'kpi-line-info',
    icon: 'kpi-icon-info',
    aura: 'kpi-aura-info',
    value: 'bg-grad-info',
  },
  success: {
    line: 'kpi-line-success',
    icon: 'kpi-icon-success',
    aura: 'kpi-aura-success',
    value: 'bg-grad-success',
  },
  warning: {
    line: 'kpi-line-warning',
    icon: 'kpi-icon-warning',
    aura: 'kpi-aura-warning',
    value: 'bg-grad-warning',
  },
  danger: {
    line: 'kpi-line-danger',
    icon: 'kpi-icon-danger',
    aura: 'kpi-aura-danger',
    value: 'bg-grad-danger',
  },
};

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  accent?: AccentTone;
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
  accent = 'primary',
  trend,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-grad-card border border-border-default rounded-xl p-5 animate-pulse sheen">
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 bg-surface-elevated rounded w-24"></div>
          <div className="h-8 w-8 bg-surface-elevated rounded-xl"></div>
        </div>
        <div className="h-8 bg-surface-elevated rounded w-16 mb-2"></div>
        <div className="h-3 bg-surface-elevated rounded w-32"></div>
      </div>
    );
  }

  const a = ACCENT_CONFIG[accent];

  return (
    <div className="bg-grad-card border border-border-default hover:border-border-strong rounded-xl p-5 shadow-card hover:shadow-modal hover-lift sheen kpi-card group relative overflow-hidden">
      <span className={`kpi-line ${a.line}`} />
      <span className={`kpi-aura ${a.aura}`} />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase">
            {title}
          </span>
          {icon && (
            <div
              className={`p-2 rounded-xl ${a.icon} transition-transform duration-300 group-hover:scale-110`}
            >
              {icon}
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-black text-text-primary tracking-tight">{value}</span>
          {trend && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                trend.isPositive
                  ? 'bg-status-success/10 text-status-success border border-status-success/20'
                  : 'bg-status-error/10 text-status-error border border-status-error/20'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
        {subtitle && <p className="text-text-muted text-[10px] mt-1 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  );
};
