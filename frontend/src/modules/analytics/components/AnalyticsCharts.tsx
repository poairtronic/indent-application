import React from 'react';

// ──────────────────────────────────────────────────────────────
// 1. DONUT / PIE CHART
// ──────────────────────────────────────────────────────────────

interface DonutChartProps {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, size = 200, thickness = 24 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  // Default vibrant color palette
  const defaultColors = [
    '#6366f1', // indigo
    '#0ea5e9', // sky
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // pink
    '#8b5cf6', // violet
  ];

  let accumulatedPercentage = 0;

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-4">
      {/* SVG Container */}
      <div className="relative" style={{ width: size, height: size }}>
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
          <span className="text-2xl font-bold text-text-primary">{total}</span>
          <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
            Total
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex flex-col gap-2">
        {data.map((item, idx) => {
          const color = item.color || defaultColors[idx % defaultColors.length];
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={idx} className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-text-secondary text-sm font-medium">{item.label}</span>
              <span className="text-text-muted text-sm font-semibold">
                {item.value} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// 2. VERTICAL BAR CHART
// ──────────────────────────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 200, color = '#6366f1' }) => {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col w-full p-4">
      {/* Chart container */}
      <div className="flex items-end gap-3 md:gap-6 border-b border-border-default h-[220px] pb-2 px-4">
        {data.map((item, idx) => {
          const pct = item.value / max;
          const barHeight = Math.max(pct * height, 8); // minimal height for visual feedback

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center group relative h-full justify-end"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 bg-surface-elevated border border-border-default text-text-primary text-xs px-2.5 py-1 rounded shadow-card opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                {item.value} units
              </div>
              {/* Bar representation */}
              <div
                style={{ height: barHeight, backgroundColor: color }}
                className="w-full rounded-t transition-all duration-500 ease-out group-hover:brightness-110 shadow-card"
              />
              {/* X label */}
              <span className="text-xs text-text-muted font-semibold mt-2 text-center truncate max-w-[60px] md:max-w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// 3. HORIZONTAL BAR CHART
// ──────────────────────────────────────────────────────────────

interface HorizontalBarChartProps {
  data: { label: string; value: number }[];
  color?: string;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  data,
  color = '#0ea5e9',
}) => {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-4 p-4 w-full">
      {data.map((item, idx) => {
        const percentage = (item.value / max) * 100;

        return (
          <div key={idx} className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary font-medium truncate max-w-[200px]">
                {item.label}
              </span>
              <span className="text-text-primary font-bold">{item.value}</span>
            </div>
            <div className="w-full bg-surface-elevated rounded-full h-3.5 border border-border-default relative overflow-hidden">
              <div
                style={{ width: `${percentage}%`, backgroundColor: color }}
                className="h-full rounded-full transition-all duration-700 ease-out shadow-inner"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// 4. LINE / TREND CHART
// ──────────────────────────────────────────────────────────────

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ data, height = 160, color = '#10b981' }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;

  const width = 500;
  const padding = 20;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Generate coordinate points for lines
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
    <div className="flex flex-col w-full p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Grid lines */}
        <line
          x1={padding}
          y1={padding}
          x2={width - padding}
          y2={padding}
          stroke="var(--border-strong)"
          strokeDasharray="4 4"
          className="opacity-40"
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="var(--border-strong)"
          className="opacity-60"
        />

        {/* Fill Area gradient path */}
        {points.length > 1 && (
          <>
            <defs>
              <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={fillD} fill="url(#area-grad)" />
            <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {/* Data points */}
        {points.map((p, idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill={color}
              stroke="var(--bg-main)"
              strokeWidth="2"
              className="chart-point"
            />
            {/* Tooltip on hover */}
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
      {/* X Labels */}
      <div className="flex justify-between px-3 mt-2">
        {data.map((item, idx) => (
          <span key={idx} className="text-[10px] text-text-muted font-semibold">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};
