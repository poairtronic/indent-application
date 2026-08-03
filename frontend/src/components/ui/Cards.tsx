import React from 'react';

type AccentTone = 'primary' | 'info' | 'success' | 'warning' | 'danger';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

const ACCENT_CONFIG: Record<
  AccentTone,
  { line: string; icon: string; aura: string; glow: string; value: string; trend: string }
> = {
  primary: {
    line: 'kpi-line-primary',
    icon: 'kpi-icon-primary',
    aura: 'kpi-aura-primary',
    glow: 'hover:shadow-glow',
    value: 'bg-grad-primary',
    trend: 'text-accent-primary',
  },
  info: {
    line: 'kpi-line-info',
    icon: 'kpi-icon-info',
    aura: 'kpi-aura-info',
    glow: 'hover:shadow-glow-info',
    value: 'bg-grad-info',
    trend: 'text-info',
  },
  success: {
    line: 'kpi-line-success',
    icon: 'kpi-icon-success',
    aura: 'kpi-aura-success',
    glow: 'hover:shadow-glow-success',
    value: 'bg-grad-success',
    trend: 'text-status-success',
  },
  warning: {
    line: 'kpi-line-warning',
    icon: 'kpi-icon-warning',
    aura: 'kpi-aura-warning',
    glow: 'hover:shadow-glow-warning',
    value: 'bg-grad-warning',
    trend: 'text-status-warning',
  },
  danger: {
    line: 'kpi-line-danger',
    icon: 'kpi-icon-danger',
    aura: 'kpi-aura-danger',
    glow: 'hover:shadow-glow-danger',
    value: 'bg-grad-danger',
    trend: 'text-status-error',
  },
};

export const BaseCard: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-grad-card border border-border-default rounded-xl p-5 font-sans text-xs text-text-primary shadow-card hover:shadow-modal hover:border-border-strong hover-lift ${className}`}
    >
      {children}
    </div>
  );
};

export const GlassCard: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`glass-surface rounded-xl p-5 font-sans text-xs text-text-primary sheen hover-lift ${className}`}
    >
      {children}
    </div>
  );
};

interface MetricCardProps extends CardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'none';
  helperText?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  trendDirection = 'none',
  helperText,
  className = '',
}) => {
  const isUp = trendDirection === 'up';
  const isDown = trendDirection === 'down';
  const trendColor = isUp
    ? 'text-status-success'
    : isDown
      ? 'text-status-error'
      : 'text-accent-primary';

  return (
    <BaseCard className={className}>
      <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
        {title}
      </span>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-2xl font-black text-text-primary tracking-tight">{value}</span>
        {trend && (
          <span className={`text-[10px] font-extrabold ${trendColor}`}>
            {isUp ? '↑ ' : isDown ? '↓ ' : ''}
            {trend}
          </span>
        )}
      </div>
      {helperText && <p className="text-[10px] text-text-muted mt-1.5">{helperText}</p>}
    </BaseCard>
  );
};

interface KPICardProps extends Omit<MetricCardProps, 'trend'> {
  icon?: React.ReactNode;
  accent?: AccentTone;
  loading?: boolean;
  trend?:
    | string
    | {
        value: number | string;
        isPositive: boolean;
      };
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  trend,
  trendDirection = 'none',
  helperText,
  icon,
  accent = 'primary',
  loading = false,
  className = '',
}) => {
  if (loading) {
    return (
      <div className="bg-grad-card border border-border-default rounded-xl p-5 animate-pulse sheen">
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 bg-surface-elevated rounded w-24" />
          <div className="h-8 w-8 bg-surface-elevated rounded-xl" />
        </div>
        <div className="h-8 bg-surface-elevated rounded w-16 mb-2" />
        <div className="h-3 bg-surface-elevated rounded w-32" />
      </div>
    );
  }

  const a = ACCENT_CONFIG[accent];

  // Support both trend API shapes: { value, isPositive } and { trend, trendDirection }
  const trendIsPositive =
    trend && typeof trend === 'object' && 'isPositive' in trend
      ? trend.isPositive
      : trendDirection === 'up';
  const trendValue =
    trend && typeof trend === 'object' && 'value' in trend
      ? trend.value
      : typeof trend === 'string'
        ? trend
        : undefined;
  const showTrend = trendValue !== undefined && trendValue !== '';

  return (
    <BaseCard className={`kpi-card ${a.glow} ${className}`}>
      <span className={`kpi-line ${a.line}`} />
      <span className={`kpi-aura ${a.aura}`} />
      <div className="relative z-10 flex justify-between items-start">
        <div className="space-y-1.5">
          <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
            {title}
          </span>
          <span
            className={`block text-2xl font-black tracking-tight ${a.value} bg-clip-text text-transparent`}
          >
            {value}
          </span>
        </div>
        {icon && <div className={`p-2.5 rounded-xl shrink-0 ${a.icon}`}>{icon}</div>}
      </div>
      {(showTrend || helperText) && (
        <div className="relative z-10 flex items-center gap-1.5 mt-3 pt-3 border-t border-border-default/50 text-[10px]">
          {showTrend && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-md ${
                trendIsPositive
                  ? 'bg-status-success/10 text-status-success border border-status-success/20'
                  : 'bg-status-error/10 text-status-error border border-status-error/20'
              }`}
            >
              {trendIsPositive ? '↑' : '↓'} {trendValue}
            </span>
          )}
          {helperText && <span className="text-text-muted">{helperText}</span>}
        </div>
      )}
    </BaseCard>
  );
};

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-grad-card border border-border-default hover:border-accent-primary rounded-xl p-5 font-sans text-xs text-text-primary flex items-start gap-3 cursor-pointer select-none shadow-card hover:shadow-glow sheen hover-lift focus-visible:outline-none ${className}`}
    >
      <div className="p-2.5 rounded-xl text-accent-primary shrink-0 ring-1 ring-inset ring-border-default/60 relative z-10 kpi-icon-primary">
        {icon}
      </div>
      <div className="min-w-0 relative z-10">
        <h4 className="font-bold text-text-primary truncate">{title}</h4>
        <p className="text-[10px] text-text-muted mt-1 leading-normal">{description}</p>
      </div>
    </div>
  );
};

export const TimelineCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <BaseCard className={`relative border-l-2 border-l-accent-primary ${className}`}>
      {children}
    </BaseCard>
  );
};

export const DashboardWidgetCard: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = '' }) => {
  return (
    <BaseCard className={`flex flex-col gap-4 ${className}`}>
      <div className="border-b border-border-default/50 pb-2">
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">{title}</h4>
      </div>
      <div className="flex-1">{children}</div>
    </BaseCard>
  );
};
