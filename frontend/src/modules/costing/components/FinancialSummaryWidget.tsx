import React from 'react';
import type { CostSheet } from '../../../types/costing';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

interface FinancialSummaryWidgetProps {
  costSheet: CostSheet | undefined;
}

export const FinancialSummaryWidget: React.FC<FinancialSummaryWidgetProps> = ({ costSheet }) => {
  if (!costSheet) return null;

  const planned = costSheet.predictedTotal || 0;
  const actual = costSheet.actualTotal || 0;
  const variance = costSheet.varianceAmount || 0;
  const variancePct = costSheet.variancePercentage || 0;

  const isOverBudget = variance > 0;
  const isUnderBudget = variance < 0;

  let VarianceIcon = Minus;
  let varianceColor = 'text-text-muted';
  let varianceBg = 'bg-surface-elevated';

  if (isOverBudget) {
    VarianceIcon = ArrowUpRight;
    varianceColor = 'text-status-error';
    varianceBg = 'bg-status-error/10';
  } else if (isUnderBudget) {
    VarianceIcon = ArrowDownRight;
    varianceColor = 'text-status-success';
    varianceBg = 'bg-status-success/10';
  }

  // Calculate percentage of budget used for the progress bar (max 100% visually)
  const budgetUsedPct = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;
  const overBudgetPct = planned > 0 && isOverBudget ? Math.min(((actual - planned) / planned) * 100, 100) : 0;

  return (
    <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
      <h3 className="text-sm font-bold text-text-primary mb-6">Financial Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Planned Cost</p>
          <p className="text-2xl font-bold text-text-primary">
            ₹{planned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Actual Cost</p>
          <p className="text-2xl font-bold text-accent-primary">
            ₹{actual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Cost Variance</p>
          <div className="flex items-center gap-2">
            <p className={`text-2xl font-bold ${varianceColor}`}>
              {isOverBudget ? '+' : ''}₹{variance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${varianceBg} ${varianceColor} text-xs font-medium`}>
              <VarianceIcon size={12} />
              <span>{Math.abs(variancePct).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-text-secondary">Budget Utilization</span>
          <span className={isOverBudget ? 'text-status-error' : 'text-text-primary'}>
            {planned > 0 ? ((actual / planned) * 100).toFixed(1) : 0}%
          </span>
        </div>
        <div className="h-3 w-full bg-surface-elevated rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-accent-primary transition-all duration-500 ease-out"
            style={{ width: `${budgetUsedPct}%` }}
          />
          {isOverBudget && (
            <div 
              className="h-full bg-status-error transition-all duration-500 ease-out"
              style={{ width: `${overBudgetPct}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-xs text-text-muted pt-1">
          <span>₹0</span>
          <span>Target: ₹{planned.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
