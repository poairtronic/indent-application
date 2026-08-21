import React, { useMemo } from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { RankedHorizontalBarChart } from '../components/AnalyticsCharts';
import { useDepartmentAnalytics } from '../hooks/useAnalytics';
import { ErrorState } from '../../../components/ui/ErrorState';

const DEPARTMENT_NAMES: Record<string, string> = {
  STOR: 'Stores Department',
  SMGR: 'Senior Manager',
  PROD: 'Production Department',
  ACCT: 'Accounts & Finance',
  DSGN: 'Design & Engineering',
  ADMIN: 'System Administration',
  GMGR: 'General Manager',
};

export const DepartmentsPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useDepartmentAnalytics();

  const rankedDeptData = useMemo(() => {
    if (!data?.departments?.length) return [];
    return [...data.departments]
      .sort((a, b) => b.pendingQueue - a.pendingQueue)
      .map((dept) => ({
        label: DEPARTMENT_NAMES[dept.departmentCode] || dept.departmentName,
        value: dept.pendingQueue,
        subValue: `${dept.completedCount} Completed`,
        color: dept.pendingQueue > 10 ? '#F59E0B' : '#8B5CF6',
        statusBadge: dept.pendingQueue > 10 ? 'High Load' : undefined,
      }));
  }, [data?.departments]);

  const liveQueueVolume = useMemo(
    () => data?.departments?.reduce((sum, d) => sum + d.pendingQueue, 0) ?? 0,
    [data?.departments],
  );

  if (error) {
    return (
      <AnalyticsLayout
        title="Department Workload Metrics"
        subtitle="Active queues and department capacity"
      >
        <ErrorState message="Error loading department workload" onRetry={() => refetch()} />
      </AnalyticsLayout>
    );
  }

  return (
    <AnalyticsLayout
      title="Department Workload Metrics"
      subtitle="Pending queues, capacity levels, and transaction counts per operating department"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KpiCard
          title="Monitored Departments"
          value={data?.departments?.length ?? 0}
          loading={isLoading}
          icon={<span>🏢</span>}
          accent="primary"
        />
        <KpiCard
          title="Highest Queue Load"
          value={DEPARTMENT_NAMES[data?.highestWorkload || ''] || data?.highestWorkload || 'None'}
          loading={isLoading}
          icon={<span>🔥</span>}
          subtitle="Department with the highest pending backlog"
          accent="warning"
        />
        <KpiCard
          title="Total Live Queue Volume"
          value={`${liveQueueVolume} Indents`}
          loading={isLoading}
          icon={<span>⏳</span>}
          accent="info"
        />
      </div>

      {!isLoading && (
        <div className="space-y-6">
          {/* Workload Queue Chart */}
          <div className="bg-surface-card border border-border-default p-6 rounded-2xl shadow-card glass-panel">
            <div className="border-b border-border-default/60 pb-3 mb-4">
              <h3 className="text-text-primary font-bold text-base">
                Department Pending Workload (Ranked)
              </h3>
              <p className="text-text-muted text-xs">
                Sorted queue pressure identifying shop-floor bottlenecks
              </p>
            </div>
            {rankedDeptData.length > 0 ? (
              <RankedHorizontalBarChart
                data={rankedDeptData}
                formatValue={(val) => `${val} Pending`}
              />
            ) : (
              <div className="h-[180px] flex items-center justify-center">
                <span className="text-text-muted text-xs">No active queues recorded.</span>
              </div>
            )}
          </div>

          {/* Department Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.departments?.map((dept) => {
              const total = dept.totalTransactions || dept.pendingQueue + dept.completedCount;
              const completedPercentage =
                total > 0 ? Math.round((dept.completedCount / total) * 100) : 0;

              return (
                <div
                  key={dept.departmentId}
                  className="bg-surface-card border border-border-default p-5 rounded-2xl space-y-3 hover:border-[#8B5CF6]/50 transition-all shadow-card glass-panel"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-text-primary font-bold text-sm truncate">
                      {DEPARTMENT_NAMES[dept.departmentCode] || dept.departmentName}
                    </h4>
                    <span className="bg-surface-elevated border border-border-default px-2 py-0.5 rounded text-[10px] font-mono text-text-muted font-bold">
                      {dept.departmentCode}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Pending Queue:</span>
                      <span className="font-bold text-[#8B5CF6] font-mono">
                        {dept.pendingQueue} Items
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Completed:</span>
                      <span className="font-bold text-status-success font-mono">
                        {dept.completedCount}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-border-default/60">
                    <div className="flex justify-between text-[11px] text-text-muted">
                      <span>Throughput Efficiency</span>
                      <span className="font-bold font-mono text-text-primary">
                        {completedPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden border border-border-default/50">
                      <div
                        style={{ width: `${completedPercentage}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-[#6D4AFF] to-[#10B981]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AnalyticsLayout>
  );
};

export default DepartmentsPage;
