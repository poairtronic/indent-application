import React from 'react';

// ──────────────────────────────────────────────────────────────
// 1. DONUT / PIE CHART
// ──────────────────────────────────────────────────────────────

interface DonutChartProps {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
  formatValue?: (val: number) => string;
}

export const DonutChart: React.FC<DonutChartProps> = React.memo(
  ({ data, size = 200, thickness = 24, formatValue }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;

    const defaultColors = [
      '#6366f1',
      '#0ea5e9',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#ec4899',
      '#8b5cf6',
    ];

    let accumulatedPercentage = 0;

    return (
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-4">
        {/* SVG Container */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--border-strong)"
              strokeWidth={thickness}
              className="opacity-25"
            />
            {total > 0 &&
              data.map((item, idx) => {
                const color = item.color || defaultColors[idx % defaultColors.length];
                const pct = item.value / total;
                const strokeLength = pct * circumference;
                const strokeOffset =
                  circumference - strokeLength + accumulatedPercentage * circumference;
                accumulatedPercentage -= pct;

                return (
                  <circle
                    key={idx}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={thickness}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out hover:brightness-110 cursor-pointer"
                  />
                );
              })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-text-primary">
              {formatValue ? formatValue(total) : total}
            </span>
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
              Total
            </span>
          </div>
        </div>

        {/* Legend list */}
        <div className="flex flex-col gap-2 min-w-0">
          {data.map((item, idx) => {
            const color = item.color || defaultColors[idx % defaultColors.length];
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const displayVal = formatValue ? formatValue(item.value) : item.value;
            return (
              <div key={idx} className="flex items-center gap-3">
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-text-secondary text-sm font-medium leading-tight">
                  {item.label}
                </span>
                <span className="text-text-muted text-sm font-semibold ml-auto pl-2 whitespace-nowrap">
                  {displayVal} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
DonutChart.displayName = 'DonutChart';

// ──────────────────────────────────────────────────────────────
// 2. VERTICAL BAR CHART
// ──────────────────────────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (val: number) => string;
}

export const BarChart: React.FC<BarChartProps> = React.memo(
  ({ data, height = 200, color = '#6366f1', formatValue }) => {
    const max = Math.max(...data.map((d) => d.value), 1);

    return (
      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: data.length * 64 }} className="flex flex-col w-full px-2 pb-2">
          {/* Bar area — fixed height, bars align to bottom */}
          <div
            className="flex items-end gap-2 border-b border-border-default px-2"
            style={{ height }}
          >
            {data.map((item, idx) => {
              const pct = item.value / max;
              const barHeight = Math.max(pct * (height - 8), 6);

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center group relative justify-end"
                  style={{ height: '100%' }}
                >
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full mb-1.5 bg-surface-elevated border border-border-default text-text-primary text-xs px-2.5 py-1 rounded shadow-card opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap left-1/2 -translate-x-1/2">
                    <span className="font-semibold">{item.label}</span>
                    <br />
                    {formatValue ? formatValue(item.value) : `${item.value} units`}
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: barHeight, backgroundColor: color }}
                    className="w-full rounded-t-md transition-all duration-500 ease-out group-hover:brightness-125 shadow-sm"
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels — fully outside the bar area, never clipped */}
          <div className="flex gap-2 px-2 mt-2">
            {data.map((item, idx) => (
              <div key={idx} className="flex-1 flex justify-center">
                <span
                  className="text-[10px] text-text-muted font-semibold text-center leading-tight block"
                  style={{ wordBreak: 'break-word', maxWidth: 80 }}
                  title={item.label}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);
BarChart.displayName = 'BarChart';

// ──────────────────────────────────────────────────────────────
// 3. GROUPED / COMPARISON BAR CHART
// ──────────────────────────────────────────────────────────────

interface GroupedBarChartProps {
  data: { label: string; planned: number; actual: number }[];
  height?: number;
  formatValue?: (val: number) => string;
}

export const GroupedBarChart: React.FC<GroupedBarChartProps> = React.memo(
  ({ data, height = 200, formatValue }) => {
    const max = Math.max(...data.flatMap((d) => [d.planned, d.actual]), 1);

    return (
      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: data.length * 100 }} className="flex flex-col w-full px-2 pb-2">
          {/* Legend */}
          <div className="flex items-center gap-4 mb-3 px-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#6366f1' }} />
              <span className="text-xs text-text-muted font-medium">Planned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#10b981' }} />
              <span className="text-xs text-text-muted font-medium">Actual</span>
            </div>
          </div>

          {/* Bar area */}
          <div
            className="flex items-end gap-3 border-b border-border-default px-2"
            style={{ height }}
          >
            {data.map((item, idx) => {
              const plannedH = Math.max((item.planned / max) * (height - 8), 4);
              const actualH = Math.max((item.actual / max) * (height - 8), 4);

              return (
                <div
                  key={idx}
                  className="flex-1 flex items-end justify-center gap-1 group relative"
                  style={{ height: '100%' }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1.5 bg-surface-elevated border border-border-default text-text-primary text-xs px-2.5 py-1.5 rounded shadow-card opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap left-1/2 -translate-x-1/2">
                    <div className="font-semibold mb-1">{item.label}</div>
                    <div className="flex gap-3">
                      <span className="text-indigo-400">
                        Planned: {formatValue ? formatValue(item.planned) : item.planned}
                      </span>
                      <span className="text-emerald-400">
                        Actual: {formatValue ? formatValue(item.actual) : item.actual}
                      </span>
                    </div>
                  </div>
                  {/* Planned bar */}
                  <div
                    style={{ height: plannedH, backgroundColor: '#6366f1' }}
                    className="flex-1 rounded-t-md transition-all duration-500 ease-out hover:brightness-125"
                  />
                  {/* Actual bar */}
                  <div
                    style={{ height: actualH, backgroundColor: '#10b981' }}
                    className="flex-1 rounded-t-md transition-all duration-500 ease-out hover:brightness-125"
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex gap-3 px-2 mt-2">
            {data.map((item, idx) => (
              <div key={idx} className="flex-1 flex justify-center">
                <span
                  className="text-[10px] text-text-muted font-semibold text-center leading-tight block"
                  style={{ wordBreak: 'break-word', maxWidth: 90 }}
                  title={item.label}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);
GroupedBarChart.displayName = 'GroupedBarChart';

// ──────────────────────────────────────────────────────────────
// 4. HORIZONTAL BAR CHART
// ──────────────────────────────────────────────────────────────

interface HorizontalBarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  formatValue?: (val: number) => string;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = React.memo(
  ({ data, color = '#0ea5e9', formatValue }) => {
    const max = Math.max(...data.map((d) => d.value), 1);

    return (
      <div className="flex flex-col gap-3.5 p-4 w-full">
        {data.map((item, idx) => {
          const percentage = (item.value / max) * 100;

          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-sm gap-3">
                <span className="text-text-secondary font-medium leading-tight">{item.label}</span>
                <span className="text-text-primary font-bold whitespace-nowrap">
                  {formatValue ? formatValue(item.value) : item.value}
                </span>
              </div>
              <div className="w-full bg-surface-elevated rounded-full h-3 border border-border-default relative overflow-hidden">
                <div
                  style={{ width: `${percentage}%`, backgroundColor: color }}
                  className="h-full rounded-full transition-all duration-700 ease-out"
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);
HorizontalBarChart.displayName = 'HorizontalBarChart';

// ──────────────────────────────────────────────────────────────
// 5. LINE / TREND CHART
// ──────────────────────────────────────────────────────────────

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const LineChart: React.FC<LineChartProps> = React.memo(
  ({ data, height = 160, color = '#10b981' }) => {
    const max = Math.max(...data.map((d) => d.value), 1);
    const min = Math.min(...data.map((d) => d.value), 0);
    const range = max - min || 1;

    const width = 500;
    const padding = 24;

    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((item, idx) => {
      const x = padding + (idx / (data.length - 1 || 1)) * chartWidth;
      const y = padding + chartHeight - ((item.value - min) / range) * chartHeight;
      return { x, y, label: item.label, value: item.value };
    });

    const pathD = points.reduce(
      (acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
      '',
    );

    const fillD =
      points.length > 0
        ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
        : '';

    return (
      <div className="flex flex-col w-full p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Baseline */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="var(--border-strong)"
            className="opacity-60"
          />
          {/* Top grid line */}
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="var(--border-strong)"
            strokeDasharray="4 4"
            className="opacity-30"
          />

          {points.length > 1 && (
            <>
              <defs>
                <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={fillD} fill="url(#area-grad)" />
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill={color}
                stroke="var(--bg-main)"
                strokeWidth="2"
              />
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="10"
                fontWeight="bold"
                className="opacity-0 group-hover:opacity-100 transition-opacity font-sans"
              >
                {p.value}
              </text>
            </g>
          ))}
        </svg>

        {/* X Labels — always outside SVG, never clipped */}
        <div className="flex justify-between px-4 mt-1">
          {data.map((item, idx) => (
            <span
              key={idx}
              className="text-[10px] text-text-muted font-semibold text-center leading-tight"
              style={{ maxWidth: 60, wordBreak: 'break-word' }}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>
    );
  },
);
LineChart.displayName = 'LineChart';
