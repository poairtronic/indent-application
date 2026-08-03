import React, { useState, useCallback } from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { FilterPanel } from '../components/AnalyticsFilters';
import { HorizontalBarChart } from '../components/AnalyticsCharts';
import { useVendorAnalytics } from '../hooks/useAnalytics';
import type { IAnalyticsFilters } from '../types/analytics.types';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';

export const VendorsPage: React.FC = () => {
  const [filters, setFilters] = useState<IAnalyticsFilters>({ limit: 50 });
  const { data, isLoading, error, refetch } = useVendorAnalytics(filters);

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
      <AnalyticsLayout title="Vendor Supply & Cost Adherence" subtitle="Vendor analytics">
        <ErrorState message="Error loading vendor analytics" onRetry={() => refetch()} />
      </AnalyticsLayout>
    );
  }

  // Map values for the Horizontal Bar Chart representation
  const chartData =
    data?.vendors?.map((item) => ({
      label: item.vendorName,
      value: item.totalPredictedAmount,
    })) || [];

  return (
    <AnalyticsLayout
      title="Vendor Supply & Cost Adherence"
      subtitle="Overview of vendor cost allocations, pricing variance adherence, and historical rankings"
    >
      {/* Limit Filter panel */}
      <div className="mb-6">
        <FilterPanel onApply={handleApply} onReset={handleReset} showLimit />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KpiCard
          title="Top Supply Vendor"
          value={data?.highestUsageVendor || 'N/A'}
          loading={isLoading}
          icon={<span>🏢</span>}
        />
        <KpiCard
          title="Best Price Adherence"
          value={data?.bestPerformingVendor || 'N/A'}
          loading={isLoading}
          icon={<span>🛡️</span>}
          subtitle="Vendor with lowest cost variance percentage"
        />
        <KpiCard
          title="Vendors Evaluated"
          value={data?.vendors.length ?? 0}
          loading={isLoading}
          icon={<span>📈</span>}
        />
      </div>

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Horizontal Bar Chart showing allocations */}
          <div className="bg-surface-card border border-border-default p-6 rounded-xl lg:col-span-2">
            <h3 className="text-text-primary font-bold text-lg mb-4">
              Vendor Supply Value Allocation
            </h3>
            {chartData.length > 0 ? (
              <HorizontalBarChart data={chartData} />
            ) : (
              <EmptyState title="No data" description="No vendor allocations found." />
            )}
          </div>

          {/* Adherence List Table */}
          <div className="bg-surface-card border border-border-default p-6 rounded-xl flex flex-col">
            <h3 className="text-text-primary font-bold text-lg mb-4 border-b border-border-default pb-2">
              Price Variance Index
            </h3>
            <div className="space-y-4 overflow-y-auto max-h-[360px] pr-2 flex-1">
              {data?.vendors?.map((v) => {
                const isOver = (v.totalVariance ?? 0) > 0;
                return (
                  <div key={v.vendorId} className="flex justify-between items-center text-sm">
                    <div className="space-y-0.5">
                      <p className="text-text-primary font-semibold">{v.vendorName}</p>
                      <p className="text-text-disabled text-xs font-mono">{v.vendorCode}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-text-primary font-bold">
                        {formatCurrency(v.totalPredictedAmount)}
                      </p>
                      {v.variancePercentage !== null ? (
                        <p
                          className={`text-xs font-semibold ${
                            isOver ? 'text-status-error' : 'text-status-success'
                          }`}
                        >
                          {v.variancePercentage > 0 ? '+' : ''}
                          {v.variancePercentage}% var
                        </p>
                      ) : (
                        <p className="text-text-disabled text-xs">No actual entries</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {data?.vendors.length === 0 && (
                <EmptyState title="No data" description="No vendor analytics available." />
              )}
            </div>
          </div>
        </div>
      )}
    </AnalyticsLayout>
  );
};
