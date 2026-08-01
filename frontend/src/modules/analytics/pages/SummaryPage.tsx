import React from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { DonutChart } from '../components/AnalyticsCharts';
import { useAnalyticsSummary } from '../hooks/useAnalytics';

export const SummaryPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useAnalyticsSummary();

  if (error) {
    return (
      <AnalyticsLayout title="Executive Analytics Summary" subtitle="Operational dashboard metrics">
        <div className="bg-red-950/20 border border-red-800/40 p-6 rounded-xl text-center text-red-400">
          <p className="font-semibold mb-2">Error loading analytics summary</p>
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

  // Map status breakdown values for the donut representation
  const chartData =
    data?.statusBreakdown.map((item) => ({
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
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl lg:col-span-2">
            <h3 className="text-white font-bold text-lg mb-4">Transaction Status Distribution</h3>
            {chartData.length > 0 ? (
              <DonutChart data={chartData} />
            ) : (
              <div className="text-slate-400 text-center py-12 text-sm">
                No transaction records found.
              </div>
            )}
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="text-white font-bold text-lg mb-2">Passive Executive Monitor</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Senior Managers & General Managers monitor operations through this dashboard. State
                changes trigger automated notifications rather than blocking manual approvals.
              </p>
            </div>
            <div className="border-t border-slate-700/60 pt-4 mt-6 flex justify-between items-center text-xs text-slate-500 font-medium">
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
