import React from 'react';

export interface SummaryMetric {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface PrintSummaryProps {
  title?: string;
  metrics: SummaryMetric[];
  className?: string;
}

export const PrintSummary: React.FC<PrintSummaryProps> = ({
  title = 'REPORT SUMMARY',
  metrics,
  className = '',
}) => {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div className={`mb-5 print-break-inside-avoid ${className}`}>
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-2 border-b border-gray-200 pb-1">
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className={`p-2 rounded border text-center ${
              m.highlight ? 'bg-gray-100 border-gray-400 font-bold' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <span className="block text-[8px] uppercase tracking-wider text-gray-500 font-semibold truncate">
              {m.label}
            </span>
            <span
              className={`block text-sm mt-0.5 ${
                m.highlight ? 'text-gray-950 font-extrabold' : 'text-gray-800 font-bold'
              }`}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
