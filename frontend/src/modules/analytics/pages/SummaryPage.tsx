import React from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { DonutChart } from '../components/AnalyticsCharts';
import { useAnalyticsSummary } from '../hooks/useAnalytics';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';

export const SummaryPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useAnalyticsSummary();

  if (error) {
    return (
      <AnalyticsLayout title="Executive Analytics Summary" subtitle="Operational dashboard metrics">
        <ErrorState message="Error loading analytics summary" onRetry={() => refetch()} />
      </AnalyticsLayout>
    );
  }

  // Map status breakdown values for the donut representation
  const chartData =
    data?.statusBreakdown?.map((item) => ({
      label: item.status,
      value: item.count,
    })) || [];

  return (
    <AnalyticsLayout
      title="Executive Analytics Summary"
      subtitle="Operational transaction metrics and flow overview"
    >
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KpiCard
          title="Total Transactions"
          value={data?.totalTransactions ?? 0}
          loading={isLoading}
          icon={<span>📋</span>}
        />
        <KpiCard
          title="Active (Loop 1)"
          value={data?.activeTransactions ?? 0}
          loading={isLoading}
          icon={<span>🔄</span>}
        />
        <KpiCard
          title="Pending (Loop 2)"
          value={data?.pendingTransactions ?? 0}
          loading={isLoading}
          icon={<span>⏳</span>}
        />
        <KpiCard
          title="Completed"
          value={data?.completedTransactions ?? 0}
          loading={isLoading}
          icon={<span>✅</span>}
        />
        <KpiCard
          title="Archived"
          value={data?.archivedTransactions ?? 0}
          loading={isLoading}
          icon={<span>📦</span>}
        />
      </div>

      {/* Chart Layout */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-surface-card border border-border-default p-6 rounded-xl lg:col-span-2">
            <h3 className="text-text-primary font-bold text-lg mb-4">
              Transaction Status Distribution
            </h3>
            {chartData.length > 0 ? (
              <DonutChart data={chartData} />
            ) : (
              <EmptyState title="No data" description="No transaction records found." />
            )}
          </div>
          <div className="bg-surface-card border border-border-default p-6 rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="text-text-primary font-bold text-lg mb-2">
                Passive Executive Monitor
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Senior Managers & General Managers monitor operations through this dashboard. State
                changes trigger automated notifications rather than blocking manual approvals.
              </p>
            </div>
            <div className="border-t border-border-default pt-4 mt-6 flex justify-between items-center text-xs text-text-disabled font-medium">
              <span>Data source: Live Database</span>
              <span>
                Refreshed:{' '}
                {data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </AnalyticsLayout>
  );
};
