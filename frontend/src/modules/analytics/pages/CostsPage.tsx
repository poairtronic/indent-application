import React, { useState } from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { FilterPanel } from '../components/AnalyticsFilters';
import { useCostAnalytics } from '../hooks/useAnalytics';
import type { IAnalyticsFilters } from '../types/analytics.types';

export const CostsPage: React.FC = () => {
  const [filters, setFilters] = useState<IAnalyticsFilters>({});
  const { data, isLoading, error, refetch } = useCostAnalytics(filters);

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleApply = (newFilters: IAnalyticsFilters) => {
    setFilters(newFilters);
  };

  const handleReset = () => {
    setFilters({});
  };

  if (error) {
    return (
      <AnalyticsLayout title="Cost Estimation & Actual Variance" subtitle="Financial analytics">
        <div className="bg-red-950/20 border border-red-800/40 p-6 rounded-xl text-center text-red-400">
          <p className="font-semibold mb-2">Error loading cost analytics</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 bg-red-800 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </AnalyticsLayout>
    );
  }

  const isOverPlanned = (data?.totalVarianceAmount ?? 0) > 0;

  return (
    <AnalyticsLayout
      title="Cost Estimation & Actual Variance"
      subtitle="Detailed overview of planned versus actual project costing metrics and variance tracking"
    >
      {/* Filter panel */}
      <div className="mb-6">
        <FilterPanel onApply={handleApply} onReset={handleReset} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Total Planned Cost"
          value={formatCurrency(data?.totalPlannedCost)}
          loading={isLoading}
          icon={<span>📋</span>}
        />
        <KpiCard
          title="Total Actual Cost"
          value={formatCurrency(data?.totalActualCost)}
          loading={isLoading}
          icon={<span>💰</span>}
        />
        <KpiCard
          title="Total Variance"
          value={formatCurrency(data?.totalVarianceAmount)}
          loading={isLoading}
          icon={<span>📊</span>}
          trend={{
            value:
              data?.totalVarianceAmount !== undefined
                ? formatCurrency(Math.abs(data.totalVarianceAmount))
                : '₹0',
            isPositive: !isOverPlanned, // Positive trend if actual is less than planned
          }}
          subtitle={isOverPlanned ? 'Over planned estimate' : 'Under planned estimate'}
        />
        <KpiCard
          title="Avg Variance Percentage"
          value={
            data?.averageVariancePercentage !== undefined
              ? `${data.averageVariancePercentage}%`
              : '0%'
          }
          loading={isLoading}
          icon={<span>📈</span>}
        />
      </div>

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl space-y-4">
            <h3 className="text-white font-bold text-lg border-b border-slate-700 pb-2">
              Financial Processing Records
            </h3>
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Finalized Cost Sheets</span>
                <span className="text-white font-extrabold text-lg">
                  {data?.finalizedCostSheets}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-slate-700/40 pt-3">
                <span className="text-slate-400">Draft Cost Sheets</span>
                <span className="text-white font-extrabold text-lg">{data?.draftCostSheets}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-slate-700/40 pt-3">
                <span className="text-slate-400">Total Recorded Cost Sheets</span>
                <span className="text-white font-extrabold text-lg">
                  {(data?.finalizedCostSheets ?? 0) + (data?.draftCostSheets ?? 0)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-slate-700/40 pt-3">
                <span className="text-slate-400">Cost Sheets with Actual Entry</span>
                <span className="text-indigo-400 font-extrabold text-lg">
                  {data?.costSheetsWithActuals}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="text-white font-bold text-lg mb-2">Variance Definition</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Variance represents the margin differences calculated during stage transitions
                inside Loop 2. Negative variance numbers denote favorable financial conditions
                (savings over planned estimates), while positive numbers point to budget overflows.
              </p>
            </div>
            <div className="border-t border-slate-700/60 pt-4 mt-6 text-xs text-slate-500 font-medium">
              <span>
                Date Filtering: {data?.dateRange.from ? 'Active' : 'Unfiltered (All Time)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </AnalyticsLayout>
  );
};
