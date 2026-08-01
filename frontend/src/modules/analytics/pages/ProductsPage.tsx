import React, { useState } from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { FilterPanel } from '../components/AnalyticsFilters';
import { useProductAnalytics } from '../hooks/useAnalytics';
import type { IAnalyticsFilters } from '../types/analytics.types';

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

  const handleApply = (newFilters: IAnalyticsFilters) => {
    setFilters(newFilters);
  };

  const handleReset = () => {
    setFilters({ limit: 50 });
  };

  if (error) {
    return (
      <AnalyticsLayout title="Product Intelligence & Estimation" subtitle="Product costing metrics">
        <div className="bg-red-950/20 border border-red-800/40 p-6 rounded-xl text-center text-red-400">
          <p className="font-semibold mb-2">Error loading product analytics</p>
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
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-slate-700">
            <h3 className="text-white font-bold text-lg">Product Statistics Dashboard</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-900/40">
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3 text-center">Run Count</th>
                  <th className="px-6 py-3 text-right">Avg Planned Cost</th>
                  <th className="px-6 py-3 text-right">Avg Actual Cost</th>
                  <th className="px-6 py-3 text-right">Max Planned Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {data?.products.map((p) => (
                  <tr key={p.productId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400">{p.productCode}</td>
                    <td className="px-6 py-4 font-semibold text-white">{p.productName}</td>
                    <td className="px-6 py-4 text-center">{p.indentCount}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(p.averagePlannedCost)}</td>
                    <td className="px-6 py-4 text-right text-indigo-400 font-medium">
                      {formatCurrency(p.averageActualCost)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400">
                      {formatCurrency(p.highestPlannedCost)}
                    </td>
                  </tr>
                ))}
                {data?.products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500 font-medium">
                      No product statistics available.
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
