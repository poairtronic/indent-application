import React from 'react';
import { KPICard } from '../../../components/ui/Cards';

type AccentTone = 'primary' | 'info' | 'success' | 'warning' | 'danger';

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
  return (
    <KPICard
      title={title}
      value={value}
      icon={icon}
      helperText={subtitle}
      accent={accent}
      trend={trend}
      loading={loading}
    />
  );
};
