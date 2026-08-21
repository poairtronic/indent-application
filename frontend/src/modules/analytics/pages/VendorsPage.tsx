import React, { useState, useCallback, useMemo } from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { FilterPanel } from '../components/AnalyticsFilters';
import { RankedHorizontalBarChart } from '../components/AnalyticsCharts';
import { useVendorAnalytics } from '../hooks/useAnalytics';
import type { IAnalyticsFilters } from '../types/analytics.types';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useCurrencyFormatter } from '../../../utils/currencyFormatter';

export const VendorsPage: React.FC = () => {
  const [filters, setFilters] = useState<IAnalyticsFilters>({ limit: 50 });
  const { data, isLoading, error, refetch } = useVendorAnalytics(filters);
  const formatCurrency = useCurrencyFormatter({ maximumFractionDigits: 0 });

  const handleApply = useCallback((newFilters: IAnalyticsFilters) => {
    setFilters(newFilters);
  }, []);

  const handleReset = useCallback(() => {
    setFilters({ limit: 50 });
  }, []);

  // Map values for the Horizontal Bar Chart representation
  const rankedVendorData = useMemo(
    () =>
      data?.vendors?.map((item) => ({
        label: item.vendorName,
        value: item.totalPredictedAmount,
        subValue: formatCurrency(item.totalPredictedAmount),
        color: '#10B981',
      })) || [],
    [data?.vendors, formatCurrency],
  );

  if (error) {
    return (
      <AnalyticsLayout title="Vendor Supply & Cost Adherence" subtitle="Vendor analytics">
        <ErrorState message="Error loading vendor analytics" onRetry={() => refetch()} />
      </AnalyticsLayout>
    );
  }

  return (
    <AnalyticsLayout
      title="Vendor Supply & Cost Adherence"
      subtitle="Overview of vendor cost allocations, pricing variance adherence, and historical rankings in INR (₹)"
    >
      {/* Limit Filter panel */}
      <div className="mb-6">
        <FilterPanel onApply={handleApply} onReset={handleReset} showLimit />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard
          title="Top Supply Vendor"
          value={data?.highestUsageVendor || 'N/A'}
          loading={isLoading}
          icon={<span>🏢</span>}
          accent="primary"
        />
        <KpiCard
          title="Best Price Adherence"
          value={data?.bestPerformingVendor || 'N/A'}
          loading={isLoading}
          icon={<span>🛡️</span>}
          subtitle="Lowest historical variance percentage"
          accent="success"
        />
        <KpiCard
          title="Active Vendors Evaluated"
          value={`${data?.vendors?.length ?? 0} Vendors`}
          loading={isLoading}
          icon={<span>📈</span>}
          accent="info"
        />
      </div>

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Horizontal Bar Chart showing allocations */}
          <div className="bg-surface-card border border-border-default p-6 rounded-2xl shadow-card lg:col-span-2 glass-panel">
            <div className="border-b border-border-default/60 pb-3 mb-4">
              <h3 className="text-text-primary font-bold text-base">
                Vendor Procurement Value Allocation
              </h3>
              <p className="text-text-muted text-xs">
                Suppliers ranked by total purchase value across active material indents
              </p>
            </div>
            {rankedVendorData.length > 0 ? (
              <RankedHorizontalBarChart
                data={rankedVendorData}
                formatValue={(val) => formatCurrency(val)}
                maxItems={10}
              />
            ) : (
              <EmptyState
                title="No vendor data available"
                description="No active vendor supply allocations found."
              />
            )}
          </div>

          {/* Adherence List Table */}
          <div className="bg-surface-card border border-border-default p-6 rounded-2xl shadow-card flex flex-col glass-panel">
            <div className="border-b border-border-default/60 pb-3 mb-4">
              <h3 className="text-text-primary font-bold text-base">Price Variance Index</h3>
              <p className="text-text-muted text-xs">Quotation adherence rating</p>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1 flex-1">
              {data?.vendors && data.vendors.length > 0 ? (
                data.vendors.map((v) => {
                  const isOver = (v.totalVariance ?? 0) > 0;
                  return (
                    <div
                      key={v.vendorId}
                      className="p-3.5 rounded-xl bg-surface-elevated/70 border border-border-default/70 flex justify-between items-center text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="text-text-primary font-bold truncate">{v.vendorName}</p>
                        <p className="text-[10px] text-text-muted font-mono">
                          Allocation: {formatCurrency(v.totalPredictedAmount)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 pl-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                            isOver
                              ? 'bg-status-error/15 text-status-error border border-status-error/30'
                              : 'bg-status-success/15 text-status-success border border-status-success/30'
                          }`}
                        >
                          {isOver ? '+' : ''}
                          {v.variancePercentage !== null && v.variancePercentage !== undefined
                            ? `${v.variancePercentage}%`
                            : '0%'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-text-muted text-xs">
                  No vendor pricing records found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AnalyticsLayout>
  );
};

export default VendorsPage;
