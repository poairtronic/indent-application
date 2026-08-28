import React, { useMemo } from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { DonutChart, BarChart, MERC_WORKFLOW_PALETTE } from '../components/AnalyticsCharts';
import { useWorkflowAnalytics } from '../hooks/useAnalytics';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { formatWorkflowState } from '../../../constants/workflow';

export const WorkflowPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useWorkflowAnalytics();

  const donutData = useMemo(() => {
    if (!data?.stageDistribution?.length) return [];
    return data.stageDistribution.map((item) => {
      let color = MERC_WORKFLOW_PALETTE.primary;
      const s = item.stageName.toLowerCase();
      if (s.includes('design') || s.includes('submit')) color = MERC_WORKFLOW_PALETTE.design;
      else if (s.includes('store')) color = MERC_WORKFLOW_PALETTE.stores;
      else if (s.includes('prod')) color = MERC_WORKFLOW_PALETTE.production;
      else if (s.includes('account')) color = MERC_WORKFLOW_PALETTE.accounts;
      else if (s.includes('complete')) color = MERC_WORKFLOW_PALETTE.completed;
      return {
        label: formatWorkflowState(item.stageName as any),
        value: item.count,
        color,
      };
    });
  }, [data?.stageDistribution]);

  const barData = useMemo(() => {
    if (!data?.stageDistribution?.length) return [];
    return data.stageDistribution.map((item) => ({
      label: formatWorkflowState(item.stageName as any),
      value: item.count,
      color: '#8B5CF6',
    }));
  }, [data?.stageDistribution]);

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

  return (
    <AnalyticsLayout
      title="Workflow Process Distribution"
      subtitle="Bottleneck identification, cycle time analysis, and process funnel efficiency"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Completion Rate"
          value={data?.completionRate !== undefined ? `${data.completionRate.toFixed(1)}%` : '0.0%'}
          loading={isLoading}
          icon={<span>📈</span>}
          accent="success"
        />
        <KpiCard
          title="Average Cycle Time"
          value={
            data?.averageCycleDays !== null && data?.averageCycleDays !== undefined
              ? `${data.averageCycleDays.toFixed(1)} Days`
              : 'N/A'
          }
          loading={isLoading}
          icon={<span>⏱️</span>}
          accent="primary"
        />
        <KpiCard
          title="Bottleneck Stage"
          value={data?.bottleneckStage ? formatWorkflowState(data.bottleneckStage as any) : 'None'}
          loading={isLoading}
          icon={<span>⚠️</span>}
          subtitle="Stage with highest queue load"
          accent="warning"
        />
        <KpiCard
          title="Stalled Transactions"
          value={`${data?.stalledTransactions ?? 0} Indents`}
          loading={isLoading}
          icon={<span>🛑</span>}
          subtitle="Unchanged for > 7 days"
          accent="danger"
        />
      </div>

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut Stage Breakdown */}
          <div className="lg:col-span-5 bg-surface-card border border-border-default p-6 rounded-2xl shadow-card glass-panel flex flex-col justify-between">
            <div className="border-b border-border-default/60 pb-3 mb-4">
              <h3 className="text-text-primary font-bold text-base">Stage Distribution Ratio</h3>
              <p className="text-text-muted text-xs">Relative balance of active indents</p>
            </div>
            {donutData.length > 0 ? (
              <DonutChart data={donutData} size={170} />
            ) : (
              <EmptyState title="No data" description="No active workflow indents recorded." />
            )}
          </div>

          {/* Bar Stage Volume */}
          <div className="lg:col-span-7 bg-surface-card border border-border-default p-6 rounded-2xl shadow-card glass-panel flex flex-col justify-between">
            <div className="border-b border-border-default/60 pb-3 mb-4">
              <h3 className="text-text-primary font-bold text-base">Workflow Stage Volume</h3>
              <p className="text-text-muted text-xs">
                Discrete indent count across all pipeline steps
              </p>
            </div>
            {barData.length > 0 ? (
              <BarChart data={barData} color="#8B5CF6" />
            ) : (
              <EmptyState title="No data" description="No transaction records found." />
            )}
          </div>
        </div>
      )}
    </AnalyticsLayout>
  );
};

export default WorkflowPage;
