import React, { useState, useCallback, useMemo } from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { FilterPanel } from '../components/AnalyticsFilters';
import { RankedHorizontalBarChart } from '../components/AnalyticsCharts';
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

  const rankedProductData = useMemo(
    () =>
      data?.products?.map((item) => ({
        label: item.productName,
        value: item.indentCount,
        subValue: `${item.indentCount} Runs`,
        color: '#8B5CF6',
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
          accent="primary"
        />
        <KpiCard
          title="Highest Cost Product"
          value={data?.highestCostProduct || 'N/A'}
          loading={isLoading}
          icon={<span>📈</span>}
          accent="warning"
        />
        <KpiCard
          title="Lowest Cost Product"
          value={data?.lowestCostProduct || 'N/A'}
          loading={isLoading}
          icon={<span>📉</span>}
          accent="info"
        />
      </div>

      {!isLoading && (
        <div className="space-y-6">
          {/* Ranked chart for product run count */}
          <div className="bg-surface-card border border-border-default p-6 rounded-2xl shadow-card glass-panel">
            <div className="border-b border-border-default/60 pb-3 mb-4">
              <h3 className="text-text-primary font-bold text-base">
                Product Manufacturing Volume (Ranked)
              </h3>
              <p className="text-text-muted text-xs">
                Configured manufacturing products ranked by total indent volume
              </p>
            </div>
            {rankedProductData.length > 0 ? (
              <RankedHorizontalBarChart
                data={rankedProductData}
                formatValue={(val) => `${val} Indents`}
              />
            ) : (
              <EmptyState
                title="No product runs recorded"
                description="No active product indents found for the selected filter."
              />
            )}
          </div>

          {/* Table dashboard card */}
          <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden shadow-card glass-panel">
            <div className="px-6 py-4 border-b border-border-default flex justify-between items-center">
              <div>
                <h3 className="text-text-primary font-bold text-base">
                  Product Statistics Master Table
                </h3>
                <p className="text-xs text-text-muted">
                  Detailed breakdown of material and process estimations
                </p>
              </div>
              <span className="text-xs font-mono text-text-muted bg-surface-elevated px-2.5 py-1 rounded border border-border-default">
                {data?.products?.length ?? 0} Products
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-default text-text-muted text-[10px] font-extrabold uppercase tracking-wider bg-surface-elevated/70">
                    <th className="py-3 px-4">Product Code</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Active Indents</th>
                    <th className="py-3 px-4">Avg Planned Cost</th>
                    <th className="py-3 px-4">Avg Actual Cost</th>
                    <th className="py-3 px-4">Highest Planned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/50 font-medium">
                  {data?.products && data.products.length > 0 ? (
                    data.products.map((p) => (
                      <tr key={p.productId} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#8B5CF6]">
                          {p.productCode}
                        </td>
                        <td className="py-3 px-4 text-text-primary font-semibold">
                          {p.productName}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-text-primary">
                          {p.indentCount}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-text-primary">
                          {formatCurrency(p.averagePlannedCost)}
                        </td>
                        <td className="py-3 px-4 font-mono text-text-muted">
                          {p.averageActualCost !== null
                            ? formatCurrency(p.averageActualCost)
                            : 'Pending'}
                        </td>
                        <td className="py-3 px-4 font-mono text-text-muted">
                          {formatCurrency(p.highestPlannedCost)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-text-muted">
                        No product statistics available.
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

export default ProductsPage;
