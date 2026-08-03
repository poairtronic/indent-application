import React from 'react';

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  icon?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const ActivityTimeline: React.FC<TimelineProps> = ({ items, className = '' }) => {
  return (
    <div
      className={`font-sans text-xs space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-default/50 ${className}`}
    >
      {items.map((item) => (
        <div key={item.id} className="relative pl-8 flex gap-3">
          <div className="absolute left-[7px] top-1.5 w-2 h-2 rounded-full bg-accent-primary ring-4 ring-background-primary shrink-0" />

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary">{item.title}</span>
              <span className="text-[9px] text-text-muted">{item.timestamp}</span>
            </div>
            <p className="text-text-secondary leading-normal">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export const WorkflowTimeline: React.FC<TimelineProps> = ({ items, className = '' }) => {
  return (
    <div
      className={`font-sans text-xs flex flex-col md:flex-row gap-6 justify-between select-none relative before:hidden md:before:block before:absolute before:left-6 before:right-6 before:top-4 before:h-0.5 before:bg-border-default/50 ${className}`}
    >
      {items.map((item) => (
        <div key={item.id} className="flex-1 flex flex-row md:flex-col items-start gap-3 relative">
          <div className="w-8 h-8 rounded-full border border-border-default bg-surface-card flex items-center justify-center font-bold text-xs text-text-primary shadow-card shrink-0 md:mb-2 z-10">
            {item.icon || <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />}
          </div>
          <div>
            <span className="block font-bold text-text-primary">{item.title}</span>
            <span className="block text-[10px] text-text-muted mt-0.5">{item.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const AuditTimeline: React.FC<TimelineProps> = ({ items, className = '' }) => {
  return (
    <div
      className={`font-sans text-xs space-y-5 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-default/50 ${className}`}
    >
      {items.map((item) => (
        <div key={item.id} className="relative pl-9 flex gap-3.5 items-start">
          <div className="absolute left-[9px] top-1 w-3 h-3 rounded-full border border-border-default bg-surface-card flex items-center justify-center shrink-0">
            <span className="w-1 h-1 rounded-full bg-accent-primary" />
          </div>
          <div className="flex-1 border border-border-default rounded-xl p-3 bg-surface-card shadow-card space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-text-primary">{item.title}</span>
              <span className="text-text-muted">{item.timestamp}</span>
            </div>
            <p className="text-[10px] text-text-secondary leading-normal">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
