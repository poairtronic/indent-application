import React, { useState, useCallback } from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { FilterPanel } from '../components/AnalyticsFilters';
import { useProductAnalytics } from '../hooks/useAnalytics';
import type { IAnalyticsFilters } from '../types/analytics.types';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';

export const ProductsPage: React.FC = () => {
  const [filters, setFilters] = useState<IAnalyticsFilters>({ limit: 50 });
  const { data, isLoading, error, refetch } = useProductAnalytics(filters);

  const formatCurrency = (val?: number | null) => {
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
    setFilters({ limit: 50 });
  }, []);

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
                    <td className="px-6 py-4 text-right">{formatCurrency(p.averagePlannedCost)}</td>
                    <td className="px-6 py-4 text-right text-accent-primary font-medium">
                      {formatCurrency(p.averageActualCost)}
                    </td>
                    <td className="px-6 py-4 text-right text-text-muted">
                      {formatCurrency(p.highestPlannedCost)}
                    </td>
                  </tr>
                ))}
                {data?.products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8">
                      <EmptyState title="No data" description="No product statistics available." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AnalyticsLayout>
  );
};
