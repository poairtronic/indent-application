import React, { useState, useCallback, useMemo } from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { FilterPanel } from '../components/AnalyticsFilters';
import { HorizontalBarChart } from '../components/AnalyticsCharts';
import { useProductAnalytics } from '../hooks/useAnalytics';
import type { IAnalyticsFilters } from '../types/analytics.types';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useCurrencyFormatter } from '../../../utils/currencyFormatter';

export const ProductsPage: React.FC = () => {
  const [filters, setFilters] = useState<IAnalyticsFilters>({ limit: 50 });
  const { data, isLoading, error, refetch } = useProductAnalytics(filters);
  const formatCurrency = useCurrencyFormatter({ maximumFractionDigits: 0 });

  const handleApply = useCallback((newFilters: IAnalyticsFilters) => {
    setFilters(newFilters);
  }, []);

  const handleReset = useCallback(() => {
    setFilters({ limit: 50 });
  }, []);

  const productChartData = useMemo(
    () =>
      data?.products?.map((item) => ({
        label: item.productName,
        value: item.indentCount,
      })) ?? [],
    [data?.products],
  );

  if (error) {
    return (
      <AnalyticsLayout title="Product Intelligence & Estimation" subtitle="Product costing metrics">
        <ErrorState message="Error loading product analytics" onRetry={() => refetch()} />
      </AnalyticsLayout>
    );
  }

  return (
    <AnalyticsLayout
      title="Product Intelligence & Estimation"
      subtitle="Overview of production throughput, planned cost distributions, and average process budgets"
    >
      {/* Limit Filter panel */}
      <div className="mb-6">
        <FilterPanel onApply={handleApply} onReset={handleReset} showLimit />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KpiCard
          title="Most Indented Product"
          value={data?.mostProducedProduct || 'N/A'}
          loading={isLoading}
          icon={<span>🔥</span>}
        />
        <KpiCard
          title="Highest Cost Product"
          value={data?.highestCostProduct || 'N/A'}
          loading={isLoading}
          icon={<span>📈</span>}
        />
        <KpiCard
          title="Lowest Cost Product"
          value={data?.lowestCostProduct || 'N/A'}
          loading={isLoading}
          icon={<span>📉</span>}
        />
      </div>

      {!isLoading && (
        <div className="space-y-6">
          {/* Horizontal chart for product run count */}
          <div className="bg-surface-card border border-border-default p-6 rounded-xl shadow-card">
            <h3 className="text-text-primary font-bold text-lg mb-2">
              Product Run Count Comparison
            </h3>
            <p className="text-text-muted text-xs mb-4">
              Configured products ranked by number of active/completed manufacturing runs.
            </p>
            {productChartData.length > 0 ? (
              <HorizontalBarChart data={productChartData} color="var(--primary)" />
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <span className="text-text-muted text-sm">No product runs recorded.</span>
              </div>
            )}
          </div>

          {/* Table dashboard card */}
          <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden shadow-card">
            <div className="px-6 py-4 border-b border-border-default">
              <h3 className="text-text-primary font-bold text-lg">Product Statistics Dashboard</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-default text-text-muted text-xs font-bold uppercase tracking-wider bg-surface-elevated">
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3 text-center">Run Count</th>
                    <th className="px-6 py-3 text-right">Avg Planned Cost</th>
                    <th className="px-6 py-3 text-right">Avg Actual Cost</th>
                    <th className="px-6 py-3 text-right">Max Planned Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default text-sm text-text-secondary">
                  {data?.products?.map((p) => (
                    <tr key={p.productId} className="hover:bg-surface-elevated transition-colors">
                      <td className="px-6 py-4 font-mono text-text-muted">{p.productCode}</td>
                      <td className="px-6 py-4 font-semibold text-text-primary">{p.productName}</td>
                      <td className="px-6 py-4 text-center">{p.indentCount}</td>
                      <td className="px-6 py-4 text-right">
                        {formatCurrency(p.averagePlannedCost)}
                      </td>
                      <td className="px-6 py-4 text-right text-accent-primary font-medium">
                        {formatCurrency(p.averageActualCost)}
                      </td>
                      <td className="px-6 py-4 text-right text-text-muted">
                        {formatCurrency(p.highestPlannedCost)}
                      </td>
                    </tr>
                  ))}
                  {data?.products?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8">
                        <EmptyState
                          title="No data"
                          description="No product statistics available."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AnalyticsLayout>
  );
};
