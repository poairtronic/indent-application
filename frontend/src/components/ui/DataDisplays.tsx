import React from 'react';

interface KeyValuePairProps {
  label: string;
  value: React.ReactNode;
  vertical?: boolean;
  className?: string;
}

export const KeyValuePair: React.FC<KeyValuePairProps> = ({
  label,
  value,
  vertical = false,
  className = '',
}) => {
  return (
    <div
      className={`font-sans text-xs ${vertical ? 'flex flex-col gap-1' : 'flex justify-between gap-4 items-center'} ${className}`}
    >
      <span className="font-semibold text-text-secondary">{label}</span>
      <span className="text-text-primary font-medium">{value}</span>
    </div>
  );
};

interface DescriptionListProps {
  items: { label: string; value: React.ReactNode }[];
  className?: string;
}

export const DescriptionList: React.FC<DescriptionListProps> = ({ items, className = '' }) => {
  return (
    <div className={`space-y-3 divide-y divide-border-default/30 font-sans ${className}`}>
      {items.map((item, idx) => (
        <div key={idx} className={`pt-2.5 first:pt-0`}>
          <KeyValuePair label={item.label} value={item.value} />
        </div>
      ))}
    </div>
  );
};

export const MetadataPanel: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title = 'Information Panel', children, className = '' }) => {
  return (
    <div
      className={`border border-border-default rounded-xl p-5 bg-surface-card font-sans text-xs space-y-4 ${className}`}
    >
      <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
};

export const StatisticsPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`grid grid-cols-2 gap-4 border border-border-default rounded-xl p-5 bg-surface-card font-sans text-xs ${className}`}
    >
      {children}
    </div>
  );
};
