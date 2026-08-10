import React from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { BarChart } from '../components/AnalyticsCharts';
import { useWorkflowAnalytics } from '../hooks/useAnalytics';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { formatWorkflowState } from '../../../constants/workflow';

export const WorkflowPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useWorkflowAnalytics();

  if (error) {
    return (
      <AnalyticsLayout
        title="Workflow Process Distribution"
        subtitle="Cycle times and transition bottlenecks"
      >
        <ErrorState message="Error loading workflow analytics" onRetry={() => refetch()} />
      </AnalyticsLayout>
    );
  }

  const chartData =
    data?.stageDistribution?.map((item) => ({
      label: formatWorkflowState(item.stageName as any),
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
          value={data?.bottleneckStage ? formatWorkflowState(data.bottleneckStage as any) : 'None'}
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
        <div className="bg-surface-card border border-border-default p-6 rounded-xl">
          <h3 className="text-text-primary font-bold text-lg mb-6">Workflow Stage Distribution</h3>
          {chartData.length > 0 ? (
            <BarChart data={chartData} color="var(--primary)" />
          ) : (
            <EmptyState title="No data" description="No transaction records found." />
          )}
        </div>
      )}
    </AnalyticsLayout>
  );
};
