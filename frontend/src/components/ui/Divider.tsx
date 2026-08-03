import React from 'react';

interface DividerProps {
  layout?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  layout = 'horizontal',
  label,
  className = '',
}) => {
  if (layout === 'vertical') {
    return <div className={`h-auto w-px bg-border-default self-stretch ${className}`} />;
  }

  if (label) {
    return (
      <div
        className={`flex items-center text-center font-sans text-[10px] font-semibold uppercase tracking-wider text-text-muted ${className}`}
      >
        <div className="flex-1 border-t border-border-default" />
        <span className="px-3">{label}</span>
        <div className="flex-1 border-t border-border-default" />
      </div>
    );
  }

  return <div className={`w-full border-t border-border-default ${className}`} />;
};
