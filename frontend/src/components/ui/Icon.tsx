import React from 'react';
import * as Lucide from 'lucide-react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconTone = 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'error';

interface IconProps {
  name: keyof typeof Lucide;
  size?: IconSize;
  tone?: IconTone;
  className?: string;
  onClick?: () => void;
}

const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

const toneMap: Record<IconTone, string> = {
  default: 'text-text-primary',
  muted: 'text-text-muted',
  primary: 'text-accent-primary',
  success: 'text-status-success',
  warning: 'text-status-warning',
  error: 'text-status-error',
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  tone = 'default',
  className = '',
  onClick,
}) => {
  const LucideIcon = Lucide[name] as React.ComponentType<{ size?: number; className?: string }>;

  if (!LucideIcon) {
    return <span className="w-4 h-4 bg-status-error/20 text-status-error">?</span>;
  }

  return (
    <span
      className={`inline-flex shrink-0 ${toneMap[tone]} ${
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      } ${className}`}
      onClick={onClick}
    >
      <LucideIcon size={sizeMap[size]} />
    </span>
  );
};
