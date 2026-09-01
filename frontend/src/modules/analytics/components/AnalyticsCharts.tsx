import React, { useState } from 'react';

// ──────────────────────────────────────────────────────────────
// WORKFLOW STATUS COLOR PALETTE
// ──────────────────────────────────────────────────────────────
export const MERC_WORKFLOW_PALETTE = {
  design: '#8B5CF6', // Purple
  stores: '#38BDF8', // Blue/Cyan
  production: '#F59E0B', // Amber/Orange
  accounts: '#10B981', // Green
  completed: '#64748B', // Neutral Slate
  delivered: '#06B6D4', // Cyan
  primary: '#6D4AFF',
  warning: '#F59E0B',
  danger: '#EF4444',
  success: '#10B981',
};

const DEFAULT_CHART_COLORS = [
  '#8B5CF6',
  '#38BDF8',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
];

// ──────────────────────────────────────────────────────────────
// 1. DONUT / PIE CHART (Enterprise Manufacturing Distribution)
// ──────────────────────────────────────────────────────────────

export interface DonutChartProps {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  formatValue?: (val: number) => string;
  layout?: 'horizontal' | 'vertical' | 'auto';
}

export const DonutChart: React.FC<DonutChartProps> = React.memo(
  ({ data, size = 160, formatValue, layout = 'vertical' }) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const total = data.reduce(
      (sum, item) => sum + (Number.isFinite(item.value) ? item.value : 0),
      0,
    );
    // For a solid pie chart:
    const pieRadius = size / 4;
    const pieStrokeWidth = size / 2;
    const circumference = 2 * Math.PI * pieRadius;

    let accumulatedPercentage = 0;

    const isHorizontal = layout === 'horizontal';

    return (
      <div
        className={`flex ${
          isHorizontal ? 'flex-col sm:flex-row' : 'flex-col'
        } items-center justify-center gap-5 p-1 w-full`}
      >
        {/* SVG Container */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={pieRadius}
              fill="transparent"
              stroke="var(--bg-canvas)"
              strokeWidth={pieStrokeWidth}
              className="opacity-50"
            />
            {total > 0 &&
              data.map((item, idx) => {
                const color = item.color || DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length];
                const pct = total > 0 ? item.value / total : 0;

                // For proper pie chart slicing:
                const strokeLength = pct * circumference;
                const dasharray = `${strokeLength} ${circumference - strokeLength}`;
                // To rotate clockwise, we use negative offset
                const dashoffset = -accumulatedPercentage * circumference;

                accumulatedPercentage += pct;

                const isHovered = hoveredIdx === idx;
                const isOtherHovered = hoveredIdx !== null && !isHovered;

                return (
                  <circle
                    key={idx}
                    cx={size / 2}
                    cy={size / 2}
                    r={pieRadius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={isHovered ? pieStrokeWidth + 12 : pieStrokeWidth}
                    strokeDasharray={dasharray}
                    strokeDashoffset={dashoffset}
                    className="transition-all duration-300 ease-out cursor-pointer origin-center"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{
                      opacity: isOtherHovered ? 0.3 : 1,
                      filter: isHovered
                        ? `drop-shadow(0 0 12px ${color})`
                        : 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
                      transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    }}
                  />
                );
              })}
          </svg>
          {/* Hover Tooltip (replacing central text) */}
          {hoveredIdx !== null && data[hoveredIdx] && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 transition-opacity duration-200">
              <div className="bg-[#0C1017]/90 backdrop-blur-md border border-white/10 px-3 py-2 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex flex-col items-center min-w-[100px]">
                <span className="text-white text-lg font-black font-mono">
                  {formatValue ? formatValue(data[hoveredIdx].value) : data[hoveredIdx].value}
                </span>
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider text-center">
                  {data[hoveredIdx].label}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Legend list - Full readable names without truncation */}
        <div className="w-full grid grid-cols-1 gap-1.5 pt-1">
          {data.map((item, idx) => {
            const color = item.color || DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length];
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
            const displayVal = formatValue ? formatValue(item.value) : item.value;
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className={`flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  isHovered ? 'bg-surface-elevated' : 'hover:bg-surface-elevated/60'
                }`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className={`text-xs font-semibold leading-tight ${
                      isHovered ? 'text-text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-right flex-shrink-0">
                  <span className="text-text-primary text-xs font-bold font-mono">
                    {displayVal}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono w-10 text-right">
                    {percentage}%
                  </span>
                </div>
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
// 2. PRODUCTION PROGRESS CHART (Actual vs Target Bar / Line)
// ──────────────────────────────────────────────────────────────

export interface ProductionProgressData {
  month: string;
  actual: number;
  target: number;
}

interface ProductionProgressChartProps {
  data: ProductionProgressData[];
  height?: number;
}

export const ProductionProgressChart: React.FC<ProductionProgressChartProps> = React.memo(
  ({ data, height = 220 }) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const maxVal = Math.max(...data.flatMap((d) => [d.actual, d.target]), 1);

    return (
      <div className="w-full space-y-4">
        {/* Chart Area */}
        <div className="relative w-full" style={{ height }}>
          {/* Subtle Gridlines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 border-b border-border-default">
            <div className="border-b border-border-default w-full" />
            <div className="border-b border-border-default w-full" />
            <div className="border-b border-border-default w-full" />
          </div>

          {/* Bars Container */}
          <div className="absolute inset-0 flex items-end justify-between gap-2 sm:gap-4 px-2 pb-2">
            {data.map((item, idx) => {
              const actualPct = (item.actual / maxVal) * 100;
              const targetPct = (item.target / maxVal) * 100;
              const isHovered = hoveredIdx === idx;
              const achievement =
                item.target > 0 ? ((item.actual / item.target) * 100).toFixed(1) : '100';

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Floating Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-3 z-30 bg-[#0C1017]/95 border border-white/15 text-white text-xs px-3 py-2 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] backdrop-blur-md whitespace-nowrap left-1/2 -translate-x-1/2 pointer-events-none animate-fadeIn">
                      <div className="font-bold text-gray-200 border-b border-white/10 pb-1 mb-1.5 flex items-center justify-between gap-3">
                        <span>{item.month} Production</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            Number(achievement) >= 100
                              ? 'bg-status-success/20 text-status-success'
                              : 'bg-status-warning/20 text-status-warning'
                          }`}
                        >
                          {achievement}% Target
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-[11px]">
                        <div className="flex justify-between gap-3 text-gray-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                            Actual
                          </span>
                          <span className="font-bold text-white font-mono">
                            {item.actual} units
                          </span>
                        </div>
                        <div className="flex justify-between gap-3 text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-white/40" />
                            Target
                          </span>
                          <span className="font-medium text-gray-300 font-mono">
                            {item.target} units
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dual Bars / Target Marker */}
                  <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-full">
                    {/* Target Bar (Translucent Background Pillar) */}
                    <div
                      className="w-1/2 bg-white/15 dark:bg-white/10 rounded-t-md transition-all duration-300 group-hover:bg-white/20"
                      style={{ height: `${Math.max(targetPct, 4)}%` }}
                    />
                    {/* Actual Bar (Solid MERC Purple) */}
                    <div
                      className={`w-1/2 rounded-t-md transition-all duration-300 ${
                        isHovered
                          ? 'bg-gradient-to-t from-[#6D4AFF] to-[#A78BFA] shadow-[0_0_12px_rgba(139,92,246,0.6)]'
                          : 'bg-gradient-to-t from-[#6D4AFF] to-[#8B5CF6]'
                      }`}
                      style={{ height: `${Math.max(actualPct, 4)}%` }}
                    />
                  </div>

                  {/* X-Axis Label */}
                  <span
                    className={`text-[11px] font-bold mt-2 transition-colors ${
                      isHovered ? 'text-[#8B5CF6]' : 'text-text-muted'
                    }`}
                  >
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-1 text-xs font-semibold text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-gradient-to-r from-[#6D4AFF] to-[#8B5CF6]" />
            <span>Actual Output</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-white/20 border border-white/10" />
            <span>Target Benchmark</span>
          </div>
        </div>
      </div>
    );
  },
);
ProductionProgressChart.displayName = 'ProductionProgressChart';

// ──────────────────────────────────────────────────────────────
// 3. GROUPED COST BAR CHART (Planned vs Actual Cost in INR)
// ──────────────────────────────────────────────────────────────

interface GroupedCostBarChartProps {
  data: { label: string; planned: number; actual: number }[];
  height?: number;
  formatCurrency: (val: number) => string;
}

export const GroupedCostBarChart: React.FC<GroupedCostBarChartProps> = React.memo(
  ({ data, height = 240, formatCurrency }) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    if (!data || data.length === 0) {
      return null;
    }

    const isSingleGroup = data.length === 1;
    const singleItem = data[0];
    const maxVal = Math.max(...data.flatMap((d) => [d.planned, d.actual]), 1);

    // If single group (e.g. Overall Portfolio), render a balanced, high-density executive financial comparison
    if (isSingleGroup && singleItem) {
      const planned = singleItem.planned;
      const actual = singleItem.actual;
      const variance = actual - planned;
      const actualPctOfPlanned = planned > 0 ? Math.round((actual / planned) * 100) : 0;
      const isOver = variance > 0;

      return (
        <div className="w-full space-y-5">
          {/* Header Legend */}
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted px-1 border-b border-border-default/60 pb-2">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-[#8B5CF6] shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
                <span className="text-text-primary font-bold">Planned Estimate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                <span className="text-text-primary font-bold">Actual Finalized</span>
              </div>
            </div>
            <span className="text-xs font-mono text-text-muted">Live Costing Telemetry</span>
          </div>

          {/* Side-by-side Proportional Pillars with Ratio Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Bars Container */}
            <div
              className="md:col-span-8 bg-surface-elevated/40 border border-border-default/80 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between"
              style={{ minHeight: height }}
            >
              {/* Background Reference Grid */}
              <div className="absolute inset-0 p-5 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-dashed border-text-muted w-full" />
                <div className="border-b border-dashed border-text-muted w-full" />
                <div className="border-b border-dashed border-text-muted w-full" />
                <div className="border-b border-dashed border-text-muted w-full" />
              </div>

              {/* Pillars */}
              <div className="relative z-10 flex items-end justify-center gap-12 sm:gap-20 h-44 w-full pt-4">
                {/* Planned Cost Pillar */}
                <div className="flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-xs font-mono font-bold text-[#8B5CF6] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-2.5 py-1 rounded-lg shadow-sm whitespace-nowrap">
                    {formatCurrency(planned)}
                  </span>
                  <div className="w-20 sm:w-28 bg-surface-elevated rounded-t-xl overflow-hidden border border-border-default h-full flex items-end">
                    <div
                      style={{ height: `${Math.max((planned / maxVal) * 100, 8)}%` }}
                      className="w-full bg-gradient-to-t from-[#6D4AFF] to-[#8B5CF6] rounded-t-lg transition-all duration-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] group-hover:brightness-110"
                    />
                  </div>
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Planned
                  </span>
                </div>

                {/* Actual Cost Pillar */}
                <div className="flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-xs font-mono font-bold text-[#10B981] bg-[#10B981]/15 border border-[#10B981]/30 px-2.5 py-1 rounded-lg shadow-sm whitespace-nowrap">
                    {formatCurrency(actual)}
                  </span>
                  <div className="w-20 sm:w-28 bg-surface-elevated rounded-t-xl overflow-hidden border border-border-default h-full flex items-end">
                    <div
                      style={{ height: `${Math.max((actual / maxVal) * 100, 8)}%` }}
                      className="w-full bg-gradient-to-t from-[#059669] to-[#10B981] rounded-t-lg transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:brightness-110"
                    />
                  </div>
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Actual
                  </span>
                </div>
              </div>
            </div>

            {/* Ratio & Absorption Analytics Card */}
            <div className="md:col-span-4 bg-surface-elevated/60 border border-border-default rounded-2xl p-5 space-y-4 flex flex-col justify-between h-full">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
                  Cost Realization Ratio
                </div>
                <div className="text-2xl font-black font-mono text-text-primary mt-1">
                  {actualPctOfPlanned}%
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Actual expenditure utilized against planned allocation
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-surface-card rounded-full h-2.5 overflow-hidden border border-border-default">
                  <div
                    style={{ width: `${Math.min(actualPctOfPlanned, 100)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver
                        ? 'bg-status-error'
                        : 'bg-gradient-to-r from-[#6D4AFF] via-[#8B5CF6] to-[#10B981]'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-text-muted font-mono">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100% Target</span>
                </div>
              </div>

              {/* Variance Highlight */}
              <div className="p-3 rounded-xl bg-surface-card border border-border-default">
                <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Cost Variance Delta
                </div>
                <div
                  className={`text-sm font-black font-mono mt-0.5 ${
                    isOver ? 'text-status-error' : 'text-status-success'
                  }`}
                >
                  {isOver ? '+' : ''}
                  {formatCurrency(variance)}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  {isOver ? 'Over estimated budget' : 'Under planned estimate'}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Multi-group grouped bar chart
    return (
      <div className="w-full space-y-4">
        {/* Legend */}
        <div className="flex items-center justify-between text-xs font-semibold text-text-muted px-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#8B5CF6]" />
              <span>Planned Cost</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#10B981]" />
              <span>Actual Cost</span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-text-muted">Amounts in INR (₹)</span>
        </div>

        {/* Bar area with gridlines */}
        <div
          className="relative w-full bg-surface-elevated/30 border border-border-default rounded-xl p-4 overflow-hidden"
          style={{ height }}
        >
          {/* Subtle gridlines */}
          <div className="absolute inset-x-4 inset-y-6 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="border-b border-dashed border-text-muted w-full" />
            <div className="border-b border-dashed border-text-muted w-full" />
            <div className="border-b border-dashed border-text-muted w-full" />
          </div>

          <div className="relative z-10 flex items-end justify-around gap-4 h-full pb-2">
            {data.map((item, idx) => {
              const plannedH = (item.planned / maxVal) * 100;
              const actualH = (item.actual / maxVal) * 100;
              const variance = item.actual - item.planned;
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer max-w-[120px]"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 z-30 bg-[#0C1017]/95 border border-white/15 text-white text-xs px-3 py-2 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] backdrop-blur-md whitespace-nowrap left-1/2 -translate-x-1/2 pointer-events-none">
                      <div className="font-bold text-gray-200 border-b border-white/10 pb-1 mb-1">
                        {item.label}
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between gap-4 text-purple-300">
                          <span>Planned:</span>
                          <span className="font-mono font-bold">
                            {formatCurrency(item.planned)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4 text-emerald-300">
                          <span>Actual:</span>
                          <span className="font-mono font-bold">{formatCurrency(item.actual)}</span>
                        </div>
                        <div className="flex justify-between gap-4 pt-1 border-t border-white/10">
                          <span className="text-gray-400">Variance:</span>
                          <span
                            className={`font-mono font-bold ${variance > 0 ? 'text-status-error' : 'text-status-success'}`}
                          >
                            {variance > 0 ? '+' : ''}
                            {formatCurrency(variance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dual Bar Columns */}
                  <div className="w-full flex items-end justify-center gap-2 h-full">
                    <div
                      style={{ height: `${Math.max(plannedH, 6)}%` }}
                      className="w-8 sm:w-10 bg-gradient-to-t from-[#6D4AFF] to-[#8B5CF6] rounded-t-md transition-all duration-300 group-hover:brightness-110 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                    />
                    <div
                      style={{ height: `${Math.max(actualH, 6)}%` }}
                      className="w-8 sm:w-10 bg-gradient-to-t from-[#059669] to-[#10B981] rounded-t-md transition-all duration-300 group-hover:brightness-110 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    />
                  </div>

                  <span className="text-[11px] text-text-secondary font-bold mt-2 truncate max-w-full">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  },
);
GroupedCostBarChart.displayName = 'GroupedCostBarChart';

// ──────────────────────────────────────────────────────────────
// 4. RANKED HORIZONTAL BAR CHART (Workload & Top Products)
// ──────────────────────────────────────────────────────────────

export interface RankedBarItem {
  id?: string;
  label: string;
  value: number;
  subValue?: string;
  color?: string;
  statusBadge?: string;
}

interface RankedHorizontalBarChartProps {
  data: RankedBarItem[];
  formatValue?: (val: number) => string;
  maxItems?: number;
  emptyText?: string;
}

export const RankedHorizontalBarChart: React.FC<RankedHorizontalBarChartProps> = React.memo(
  ({ data, formatValue, maxItems = 6, emptyText = 'No data available' }) => {
    const items = data.slice(0, maxItems);
    const max = Math.max(...items.map((d) => d.value), 1);

    if (items.length === 0) {
      return <div className="p-8 text-center text-xs text-text-muted font-medium">{emptyText}</div>;
    }

    return (
      <div className="flex flex-col gap-3 w-full p-2">
        {items.map((item, idx) => {
          const percentage = (item.value / max) * 100;
          const displayVal = formatValue ? formatValue(item.value) : item.value;
          const barColor = item.color || '#8B5CF6';

          return (
            <div key={idx} className="space-y-1.5 group">
              <div className="flex justify-between items-center text-xs gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-surface-elevated border border-border-default flex items-center justify-center text-[10px] font-bold text-text-muted flex-shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="text-text-primary font-bold leading-tight truncate">
                    {item.label}
                  </span>
                  {item.statusBadge && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-status-warning/15 text-status-warning uppercase">
                      {item.statusBadge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.subValue && (
                    <span className="text-[10px] text-text-muted font-medium">{item.subValue}</span>
                  )}
                  <span className="text-text-primary font-black font-mono">{displayVal}</span>
                </div>
              </div>
              <div className="w-full bg-surface-elevated rounded-full h-2.5 border border-border-default/60 relative overflow-hidden">
                <div
                  style={{ width: `${Math.max(percentage, 3)}%`, backgroundColor: barColor }}
                  className="h-full rounded-full transition-all duration-700 ease-out group-hover:brightness-110"
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);
RankedHorizontalBarChart.displayName = 'RankedHorizontalBarChart';

// ──────────────────────────────────────────────────────────────
// 5. STANDARD VERTICAL BAR CHART (Module Analytics)
// ──────────────────────────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  color?: string;
  formatValue?: (val: number) => string;
}

export const BarChart: React.FC<BarChartProps> = React.memo(
  ({ data, height = 200, color = '#8B5CF6', formatValue }) => {
    const max = Math.max(...data.map((d) => d.value), 1);

    return (
      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: data.length * 56 }} className="flex flex-col w-full px-2 pb-2">
          {/* Bar area */}
          <div
            className="flex items-end gap-2 border-b border-border-default px-2"
            style={{ height }}
          >
            {data.map((item, idx) => {
              const pct = item.value / max;
              const barHeight = Math.max(pct * (height - 12), 4);
              const barColor = item.color || color;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center group relative justify-end"
                  style={{ height: '100%' }}
                >
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full mb-1.5 bg-[#0C1017]/95 border border-white/15 text-white text-xs px-2.5 py-1 rounded shadow-card opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap left-1/2 -translate-x-1/2 font-mono">
                    <span className="font-bold">{item.label}</span>:{' '}
                    {formatValue ? formatValue(item.value) : item.value}
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: barHeight, backgroundColor: barColor }}
                    className="w-full max-w-[32px] rounded-t-md transition-all duration-500 ease-out group-hover:brightness-125 shadow-sm"
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex gap-2 px-2 mt-2">
            {data.map((item, idx) => (
              <div key={idx} className="flex-1 flex justify-center">
                <span
                  className="text-[10px] text-text-muted font-bold text-center leading-tight block truncate max-w-[64px]"
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
// 6. STANDARD HORIZONTAL BAR CHART
// ──────────────────────────────────────────────────────────────

interface HorizontalBarChartProps {
  data: { label: string; value: number; color?: string }[];
  color?: string;
  formatValue?: (val: number) => string;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = React.memo(
  ({ data, color = '#38BDF8', formatValue }) => {
    return (
      <RankedHorizontalBarChart
        data={data.map((d) => ({ ...d, color: d.color || color }))}
        formatValue={formatValue}
      />
    );
  },
);
HorizontalBarChart.displayName = 'HorizontalBarChart';

// ──────────────────────────────────────────────────────────────
// 7. LINE / TREND CHART
// ──────────────────────────────────────────────────────────────

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const LineChart: React.FC<LineChartProps> = React.memo(
  ({ data, height = 160, color = '#10B981' }) => {
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
            stroke="var(--border-default)"
            className="opacity-50"
          />
          {/* Top grid line */}
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="var(--border-default)"
            strokeDasharray="4 4"
            className="opacity-25"
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
                r="4.5"
                fill={color}
                stroke="var(--bg-canvas)"
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

        {/* X Labels */}
        <div className="flex justify-between px-4 mt-1">
          {data.map((item, idx) => (
            <span
              key={idx}
              className="text-[10px] text-text-muted font-bold text-center leading-tight truncate max-w-[60px]"
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

export default {
  DonutChart,
  BarChart,
  GroupedCostBarChart,
  RankedHorizontalBarChart,
  HorizontalBarChart,
  ProductionProgressChart,
  LineChart,
  MERC_WORKFLOW_PALETTE,
};
