import React, { useId } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const tooltipId = useId();

  return (
    <div
      className="relative group inline-block font-sans outline-none focus-visible:ring-1 focus-visible:ring-accent-primary rounded-sm"
      tabIndex={0}
      aria-describedby={tooltipId}
    >
      {children}
      <div
        id={tooltipId}
        role="tooltip"
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block group-focus:block group-focus-within:block bg-surface-card border border-border-default text-text-primary text-[10px] font-medium px-2 py-1 rounded shadow-dropdown whitespace-nowrap z-50 pointer-events-none"
      >
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border-default" />
      </div>
    </div>
  );
};
