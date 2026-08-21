import React, { useState, useCallback, useMemo } from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { FilterPanel } from '../components/AnalyticsFilters';
import { GroupedCostBarChart } from '../components/AnalyticsCharts';
import { useCostAnalytics } from '../hooks/useAnalytics';
import type { IAnalyticsFilters } from '../types/analytics.types';
import { ErrorState } from '../../../components/ui/ErrorState';
import { useCurrencyFormatter } from '../../../utils/currencyFormatter';

export const CostsPage: React.FC = () => {
  const [filters, setFilters] = useState<IAnalyticsFilters>({});
  const { data, isLoading, error, refetch } = useCostAnalytics(filters);
  const formatCurrency = useCurrencyFormatter({ maximumFractionDigits: 0 });

  const handleApply = useCallback((newFilters: IAnalyticsFilters) => {
    setFilters(newFilters);
  }, []);

  const handleReset = useCallback(() => {
    setFilters({});
  }, []);

  const isOverPlanned = (data?.totalVarianceAmount ?? 0) > 0;

  const costChartData = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: 'Overall Portfolio',
        planned: data.totalPlannedCost,
        actual: data.totalActualCost,
      },
    ];
  }, [data]);

  if (error) {
    return (
      <AnalyticsLayout title="Cost Estimation & Actual Variance" subtitle="Financial analytics">
        <ErrorState message="Error loading cost analytics" onRetry={() => refetch()} />
      </AnalyticsLayout>
    );
  }

  return (
    <AnalyticsLayout
      title="Cost Estimation & Actual Variance"
      subtitle="Detailed overview of planned versus actual project costing metrics and financial variance tracking in INR (₹)"
    >
      {/* Filter panel */}
      <div className="mb-6">
        <FilterPanel onApply={handleApply} onReset={handleReset} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Total Planned Cost"
          value={formatCurrency(data?.totalPlannedCost)}
          loading={isLoading}
          icon={<span>📋</span>}
          accent="primary"
        />
        <KpiCard
          title="Total Actual Cost"
          value={formatCurrency(data?.totalActualCost)}
          loading={isLoading}
          icon={<span>💰</span>}
          accent="info"
        />
        <KpiCard
          title="Total Variance"
          value={formatCurrency(data?.totalVarianceAmount)}
          loading={isLoading}
          icon={<span>📊</span>}
          accent={isOverPlanned ? 'danger' : 'success'}
          trend={{
            value:
              data?.totalVarianceAmount !== undefined
                ? formatCurrency(Math.abs(data.totalVarianceAmount))
                : '₹0',
            isPositive: !isOverPlanned,
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
          accent={isOverPlanned ? 'warning' : 'success'}
        />
      </div>

      {!isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Card */}
            <div className="bg-surface-card border border-border-default p-6 rounded-2xl shadow-card lg:col-span-2 glass-panel">
              <div className="border-b border-border-default/60 pb-3 mb-4">
                <h3 className="text-text-primary font-bold text-base">
                  Planned vs. Actual Cost Comparison
                </h3>
                <p className="text-text-muted text-xs">
                  Financial variance distribution across active indent cost sheets
                </p>
              </div>
              {data && (data.totalPlannedCost > 0 || data.totalActualCost > 0) ? (
                <GroupedCostBarChart
                  data={costChartData}
                  formatCurrency={formatCurrency}
                  height={220}
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <span className="text-text-muted text-xs">No costing entries recorded.</span>
                </div>
              )}
            </div>

            {/* Metrics Breakdown Card */}
            <div className="bg-surface-card border border-border-default p-6 rounded-2xl shadow-card space-y-4 glass-panel flex flex-col justify-between">
              <div className="border-b border-border-default/60 pb-3">
                <h3 className="text-text-primary font-bold text-base">Cost Component Breakdown</h3>
                <p className="text-text-muted text-xs">Material vs Process expenditures</p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-default">
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Finalized Cost Sheets:</span>
                    <span className="font-bold font-mono text-text-primary">
                      {data?.finalizedCostSheets ?? 0} Sheets
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>Cost Sheets With Actuals:</span>
                    <span className="font-bold font-mono text-text-primary">
                      {data?.costSheetsWithActuals ?? 0} Sheets
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-default space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary font-medium">Variance Health Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isOverPlanned
                          ? 'bg-status-error/20 text-status-error'
                          : 'bg-status-success/20 text-status-success'
                      }`}
                    >
                      {isOverPlanned ? 'BUDGET EXCEEDED' : 'WITHIN BUDGET'}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    {isOverPlanned
                      ? 'Total actual production expenditures currently exceed estimated initial planning.'
                      : 'Actual manufacturing expenditures are currently strictly adhering to estimated planned costs.'}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-text-muted font-mono text-center pt-2 border-t border-border-default/60">
                All amounts audited &amp; verified in INR (₹)
              </div>
            </div>
          </div>
        </div>
      )}
    </AnalyticsLayout>
  );
};

export default CostsPage;
