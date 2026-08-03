import React from 'react';

interface ChartProps {
  title: string;
  data: { label: string; value: number }[];
  type?: 'line' | 'bar' | 'donut' | 'pie' | 'scatter';
  className?: string;
}

export const ChartWrapper: React.FC<ChartProps> = ({
  title,
  data,
  type = 'bar',
  className = '',
}) => {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div
      className={`border border-border-default rounded-xl p-4 bg-surface-card font-sans text-xs flex flex-col gap-4 ${className}`}
    >
      <div className="flex justify-between items-center border-b border-border-default/50 pb-2">
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">{title}</h4>
      </div>

      <div className="w-full h-40 flex items-center justify-center relative select-none">
        {type === 'bar' && (
          <div className="w-full h-full flex items-end gap-3 px-2 pt-4">
            {data.map((d, idx) => {
              const heightPct = (d.value / maxVal) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute bottom-full mb-1 bg-surface-elevated border border-border-default px-1 py-0.5 rounded text-[8px] font-bold text-text-primary hidden group-hover:block whitespace-nowrap z-10">
                    {d.value}
                  </div>
                  <div
                    className="w-full bg-accent-primary hover:opacity-85 rounded-t transition-all duration-300"
                    style={{ height: `${heightPct}%`, minHeight: '4px' }}
                  />
                  <span className="text-[9px] text-text-muted mt-1 truncate max-w-full">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {type === 'line' && (
          <svg className="w-full h-full px-2" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line
              x1="0"
              y1="25"
              x2="100"
              y2="25"
              className="stroke-border-default/20"
              strokeWidth="0.5"
            />
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              className="stroke-border-default/20"
              strokeWidth="0.5"
            />
            <line
              x1="0"
              y1="75"
              x2="100"
              y2="75"
              className="stroke-border-default/20"
              strokeWidth="0.5"
            />

            <polyline
              fill="none"
              className="stroke-accent-primary"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={data
                .map((d, idx) => {
                  const x = (idx / Math.max(1, data.length - 1)) * 100;
                  const y = 90 - (d.value / maxVal) * 80;
                  return `${x},${y}`;
                })
                .join(' ')}
            />
            {data.map((d, idx) => {
              const x = (idx / Math.max(1, data.length - 1)) * 100;
              const y = 90 - (d.value / maxVal) * 80;
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r="2"
                  className="fill-surface-card stroke-accent-primary"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
        )}

        {type === 'donut' && (
          <div className="relative flex items-center justify-center">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="40"
                className="stroke-border-default fill-transparent"
                strokeWidth="8"
              />
              <circle
                cx="56"
                cy="56"
                r="40"
                className="stroke-accent-primary fill-transparent"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * 0.35}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-base font-black text-text-primary">65%</span>
              <span className="text-[8px] text-text-muted uppercase font-bold tracking-wide">
                Target
              </span>
            </div>
          </div>
        )}

        {type === 'pie' && (
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="24"
              className="stroke-border-default fill-transparent"
              strokeWidth="48"
            />
            <circle
              cx="48"
              cy="48"
              r="24"
              className="stroke-accent-primary fill-transparent"
              strokeWidth="48"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * 0.4}`}
            />
          </svg>
        )}

        {type === 'scatter' && (
          <svg className="w-full h-full px-2" viewBox="0 0 100 100">
            {data.map((d, idx) => {
              const x = (idx / Math.max(1, data.length - 1)) * 90 + 5;
              const y = 90 - (d.value / maxVal) * 80;
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r="3.5"
                  className="fill-accent-primary/80 stroke-accent-primary/20"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px] text-text-secondary border-t border-border-default/30 pt-2 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent-primary" />
          <span>Actual Cost</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-border-default" />
          <span>Benchmark / Target</span>
        </div>
      </div>
    </div>
  );
};
