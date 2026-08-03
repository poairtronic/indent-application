import React from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { useDepartmentAnalytics } from '../hooks/useAnalytics';
import { Button } from '../../../components/ui/Button';
import { RotateCcw } from 'lucide-react';

export const DepartmentsPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useDepartmentAnalytics();

  if (error) {
    return (
      <AnalyticsLayout
        title="Department Workload Metrics"
        subtitle="Active queues and department capacity"
      >
        <div className="bg-status-error/10 border border-status-error/25 p-6 rounded-xl text-center text-status-error">
          <p className="font-semibold mb-2">Error loading department workload</p>
          <Button
            variant="danger"
            size="sm"
            icon={<RotateCcw size={14} />}
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      </AnalyticsLayout>
    );
  }

  return (
    <AnalyticsLayout
      title="Department Workload Metrics"
      subtitle="Pending queues, capacity levels, and transaction counts per department"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KpiCard
          title="Monitored Departments"
          value={data?.departments?.length ?? 0}
          loading={isLoading}
          icon={<span>🏢</span>}
        />
        <KpiCard
          title="Highest Queue Load"
          value={data?.highestWorkload || 'None'}
          loading={isLoading}
          icon={<span>🔥</span>}
          subtitle="Department with the most pending indents"
        />
        <KpiCard
          title="Live Queue Volume"
          value={data?.departments?.reduce((sum, d) => sum + d.pendingQueue, 0) ?? 0}
          loading={isLoading}
          icon={<span>⏳</span>}
        />
      </div>

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data?.departments?.map((dept) => {
            const completedPercentage =
              dept.totalTransactions > 0
                ? Math.round((dept.completedCount / dept.totalTransactions) * 100)
                : 0;

            return (
              <div
                key={dept.departmentId}
                className="bg-surface-card border border-border-default p-6 rounded-xl space-y-4 hover:border-border-strong transition-all"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-text-primary font-bold text-lg">{dept.departmentName}</h3>
                  <span className="bg-surface-elevated border border-border-default px-3 py-1 rounded text-text-muted text-xs font-semibold uppercase tracking-wider">
                    {dept.departmentCode}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2">
                  <div className="text-center">
                    <p className="text-text-disabled text-[10px] font-semibold uppercase tracking-wider">
                      Pending Queue
                    </p>
                    <p className="text-text-primary font-extrabold text-2xl mt-1">
                      {dept.pendingQueue}
                    </p>
                  </div>
                  <div className="text-center border-x border-border-default">
                    <p className="text-text-disabled text-[10px] font-semibold uppercase tracking-wider">
                      Completed Work
                    </p>
                    <p className="text-text-primary font-extrabold text-2xl mt-1">
                      {dept.completedCount}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-text-disabled text-[10px] font-semibold uppercase tracking-wider">
                      Total Indents
                    </p>
                    <p className="text-text-primary font-extrabold text-2xl mt-1">
                      {dept.totalTransactions}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-text-muted">Completion rate</span>
                    <span className="text-text-secondary">{completedPercentage}%</span>
                  </div>
                  <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden border border-border-default">
                    <div
                      style={{ width: `${completedPercentage}%` }}
                      className="bg-accent-primary h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AnalyticsLayout>
  );
};
