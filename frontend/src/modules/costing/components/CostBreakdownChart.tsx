import React from 'react';
import type { CostSheetData } from '../../../api/services/indents/service';

interface CostBreakdownChartProps {
  costSheet: CostSheetData | undefined;
}

export const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({ costSheet }) => {
  if (!costSheet) return null;

  // Planned totals
  const plannedMaterialCost =
    costSheet.costItems?.reduce((acc, curr) => acc + (Number(curr.predictedAmount) || 0), 0) || 0;
  const plannedProcessCost =
    costSheet.processCosts?.reduce((acc, curr) => acc + (Number(curr.predictedCost) || 0), 0) || 0;
  const plannedTotal = plannedMaterialCost + plannedProcessCost;

  // Actual totals
  const actualMaterialCost =
    costSheet.costItems?.reduce((acc, curr) => acc + (Number(curr.actualAmount) || 0), 0) || 0;
  const actualProcessCost =
    costSheet.processCosts?.reduce((acc, curr) => acc + (Number(curr.actualCost) || 0), 0) || 0;
  const actualTotal = actualMaterialCost + actualProcessCost;

  // Max value for scaling bars
  const maxTotal = Math.max(plannedTotal, actualTotal) || 1;

  // Helper to render a bar
  const renderBar = (materialCost: number, processCost: number, total: number, max: number) => {
    const materialPct = total > 0 ? (materialCost / max) * 100 : 0;
    const processPct = total > 0 ? (processCost / max) * 100 : 0;

    return (
      <div className="h-6 w-full bg-surface-elevated rounded flex overflow-hidden">
        {materialPct > 0 && (
          <div
            className="h-full bg-accent-primary transition-all duration-500 ease-out flex items-center justify-center text-[10px] text-white font-medium"
            style={{ width: `${materialPct}%` }}
            title={`Materials: ₹${materialCost.toLocaleString()}`}
          >
            {materialPct > 15 ? `₹${materialCost.toLocaleString()}` : ''}
          </div>
        )}
        {processPct > 0 && (
          <div
            className="h-full bg-indigo-500 transition-all duration-500 ease-out flex items-center justify-center text-[10px] text-white font-medium"
            style={{ width: `${processPct}%` }}
            title={`Processes: ₹${processCost.toLocaleString()}`}
          >
            {processPct > 15 ? `₹${processCost.toLocaleString()}` : ''}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card h-full">
      <h3 className="text-sm font-bold text-text-primary mb-6">Cost Breakdown Analysis</h3>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-xs font-medium mb-2">
            <span className="text-text-secondary">Planned Cost</span>
            <span className="text-text-primary">₹{plannedTotal.toLocaleString()}</span>
          </div>
          {renderBar(plannedMaterialCost, plannedProcessCost, plannedTotal, maxTotal)}
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium mb-2">
            <span className="text-text-secondary">Actual Cost</span>
            <span className="text-text-primary">₹{actualTotal.toLocaleString()}</span>
          </div>
          {renderBar(actualMaterialCost, actualProcessCost, actualTotal, maxTotal)}
        </div>
      </div>

      <div className="flex gap-4 mt-8 pt-4 border-t border-border-default">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-accent-primary"></div>
          <span className="text-xs text-text-secondary">Materials</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
          <span className="text-xs text-text-secondary">Manufacturing Processes</span>
        </div>
      </div>
    </div>
  );
};
