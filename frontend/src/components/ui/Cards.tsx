import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

export const BaseCard: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-surface-card border border-border-default rounded-xl p-5 font-sans text-xs text-text-primary shadow-sm transition-all duration-200 hover:shadow-md hover:border-border-strong/70 ${className}`}
    >
      {children}
    </div>
  );
};

export const GlassCard: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-surface-card/60 backdrop-blur-md border border-border-default rounded-xl p-5 font-sans text-xs text-text-primary shadow-sm transition-all duration-200 hover:shadow-md ${className}`}
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
      : 'text-text-muted';

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

export const KPICard: React.FC<MetricCardProps & { icon?: React.ReactNode }> = ({
  title,
  value,
  trend,
  trendDirection = 'none',
  helperText,
  icon,
  className = '',
}) => {
  return (
    <BaseCard className={`relative overflow-hidden ${className}`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1.5">
          <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
            {title}
          </span>
          <span className="block text-2xl font-black text-text-primary tracking-tight">
            {value}
          </span>
        </div>
        {icon && (
          <div className="p-2.5 bg-background-secondary rounded-xl text-accent-primary shrink-0 ring-1 ring-inset ring-border-default/60">
            {icon}
          </div>
        )}
      </div>
      {(trend || helperText) && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border-default/50 text-[10px]">
          {trend && (
            <span
              className={`font-extrabold ${
                trendDirection === 'up'
                  ? 'text-status-success'
                  : trendDirection === 'down'
                    ? 'text-status-error'
                    : 'text-text-muted'
              }`}
            >
              {trend}
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
      className={`bg-surface-card border border-border-default hover:border-accent-primary rounded-xl p-5 font-sans text-xs text-text-primary flex items-start gap-3 cursor-pointer select-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none ${className}`}
    >
      <div className="p-2.5 bg-background-secondary rounded-xl text-accent-primary shrink-0 ring-1 ring-inset ring-border-default/60">
        {icon}
      </div>
      <div className="min-w-0">
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
