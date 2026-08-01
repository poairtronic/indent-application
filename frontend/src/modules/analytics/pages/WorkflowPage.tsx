import React from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { BarChart } from '../components/AnalyticsCharts';
import { useWorkflowAnalytics } from '../hooks/useAnalytics';

export const WorkflowPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useWorkflowAnalytics();

  if (error) {
    return (
      <AnalyticsLayout
        title="Workflow Process Distribution"
        subtitle="Cycle times and transition bottlenecks"
      >
        <div className="bg-red-950/20 border border-red-800/40 p-6 rounded-xl text-center text-red-400">
          <p className="font-semibold mb-2">Error loading workflow analytics</p>
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

  const chartData =
    data?.stageDistribution.map((item) => ({
      label: item.stageName,
      value: item.count,
    })) || [];

  return (
    <AnalyticsLayout
      title="Workflow Process Distribution"
      subtitle="Bottleneck identification, cycle time analysis, and process funnel efficiency"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Completion Rate"
          value={data?.completionRate !== undefined ? `${data.completionRate}%` : '0%'}
          loading={isLoading}
          icon={<span>📈</span>}
        />
        <KpiCard
          title="Average Cycle Time"
          value={
            data?.averageCycleDays !== null && data?.averageCycleDays !== undefined
              ? `${data.averageCycleDays} days`
              : 'N/A'
          }
          loading={isLoading}
          icon={<span>⏱️</span>}
        />
        <KpiCard
          title="Bottleneck Stage"
          value={data?.bottleneckStage || 'None'}
          loading={isLoading}
          icon={<span>⚠️</span>}
          subtitle="Stage with highest active count"
        />
        <KpiCard
          title="Stalled Transactions"
          value={data?.stalledTransactions ?? 0}
          loading={isLoading}
          icon={<span>🛑</span>}
          subtitle="Unchanged for >7 days"
        />
      </div>

      {!isLoading && (
        <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl">
          <h3 className="text-white font-bold text-lg mb-6">Workflow Stage Distribution</h3>
          {chartData.length > 0 ? (
            <BarChart data={chartData} color="#8b5cf6" />
          ) : (
            <div className="text-slate-400 text-center py-12 text-sm">
              No transaction records found.
            </div>
          )}
        </div>
      )}
    </AnalyticsLayout>
  );
};
