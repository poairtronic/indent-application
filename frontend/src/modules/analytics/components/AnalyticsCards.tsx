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
      <div className="bg-slate-800 border border-slate-700/60 rounded-xl p-6 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 bg-slate-700 rounded w-24"></div>
          <div className="h-8 w-8 bg-slate-700 rounded-lg"></div>
        </div>
        <div className="h-8 bg-slate-700 rounded w-16 mb-2"></div>
        <div className="h-3 bg-slate-700 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/60 hover:border-slate-600/80 transition-all rounded-xl p-6 shadow-lg shadow-slate-950/20 group">
      <div className="flex justify-between items-start mb-3">
        <span className="text-slate-400 text-sm font-semibold tracking-wide uppercase">
          {title}
        </span>
        {icon && (
          <div className="p-2 bg-slate-900/60 rounded-lg text-indigo-400 group-hover:text-indigo-300 transition-colors">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="text-slate-400 text-xs mt-1">{subtitle}</p>}
    </div>
  );
};
