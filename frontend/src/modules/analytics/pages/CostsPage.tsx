import React, { useState, useCallback } from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { FilterPanel } from '../components/AnalyticsFilters';
import { BarChart } from '../components/AnalyticsCharts';
import { useCostAnalytics } from '../hooks/useAnalytics';
import type { IAnalyticsFilters } from '../types/analytics.types';
import { ErrorState } from '../../../components/ui/ErrorState';

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

  const handleApply = useCallback((newFilters: IAnalyticsFilters) => {
    setFilters(newFilters);
  }, []);

  const handleReset = useCallback(() => {
    setFilters({});
  }, []);

  if (error) {
    return (
      <AnalyticsLayout title="Cost Estimation & Actual Variance" subtitle="Financial analytics">
        <ErrorState message="Error loading cost analytics" onRetry={() => refetch()} />
      </AnalyticsLayout>
    );
  }

  const isOverPlanned = (data?.totalVarianceAmount ?? 0) > 0;
  const costChartData = data
    ? [
        { label: 'Planned Cost', value: data.totalPlannedCost },
        { label: 'Actual Cost', value: data.totalActualCost },
      ]
    : [];

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
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Card */}
            <div className="bg-surface-card border border-border-default p-6 rounded-xl shadow-card lg:col-span-2">
              <h3 className="text-text-primary font-bold text-lg mb-4">
                Planned vs. Actual Cost Comparison
              </h3>
              {data && (data.totalPlannedCost > 0 || data.totalActualCost > 0) ? (
                <BarChart
                  data={costChartData}
                  color="var(--success)"
                  formatValue={formatCurrency}
                />
              ) : (
                <div className="h-[220px] flex items-center justify-center">
                  <span className="text-text-muted text-sm">
                    No transaction records found for this period.
                  </span>
                </div>
              )}
            </div>

            {/* Records Card */}
            <div className="bg-surface-card border border-border-default p-6 rounded-xl space-y-4 shadow-card">
              <h3 className="text-text-primary font-bold text-lg border-b border-border-default pb-2">
                Financial Processing Records
              </h3>
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">Finalized Cost Sheets</span>
                  <span className="text-text-primary font-extrabold text-lg">
                    {data?.finalizedCostSheets}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-border-default pt-3">
                  <span className="text-text-muted">Draft Cost Sheets</span>
                  <span className="text-text-primary font-extrabold text-lg">
                    {data?.draftCostSheets}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-border-default pt-3">
                  <span className="text-text-muted">Total Recorded Cost Sheets</span>
                  <span className="text-text-primary font-extrabold text-lg">
                    {(data?.finalizedCostSheets ?? 0) + (data?.draftCostSheets ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-border-default pt-3">
                  <span className="text-text-muted">Cost Sheets with Actual Entry</span>
                  <span className="text-accent-primary font-extrabold text-lg">
                    {data?.costSheetsWithActuals}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Variance definition card */}
          <div className="bg-surface-card border border-border-default p-6 rounded-xl shadow-card flex flex-col justify-between">
            <div>
              <h3 className="text-text-primary font-bold text-lg mb-2">Variance Definition</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Variance represents the margin differences calculated during stage transitions
                inside Loop 2. Negative variance numbers denote favorable financial conditions
                (savings over planned estimates), while positive numbers point to budget overflows.
              </p>
            </div>
            <div className="border-t border-border-default pt-4 mt-6 text-xs text-text-disabled font-medium">
              <span>
                Date Filtering: {data?.dateRange?.from ? 'Active' : 'Unfiltered (All Time)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </AnalyticsLayout>
  );
};
