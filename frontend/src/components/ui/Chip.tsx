import React from 'react';
import { X } from 'lucide-react';

interface ChipProps {
  label: string;
  active?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  active = false,
  onRemove,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold select-none transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${
        active
          ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
          : 'bg-background-secondary text-text-secondary border border-border-default hover:bg-surface-elevated'
      } ${className}`}
    >
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-status-error text-text-muted transition-colors rounded p-0.5 focus:outline-none"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};
