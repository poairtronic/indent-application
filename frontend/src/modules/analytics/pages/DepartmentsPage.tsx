import React from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { useDepartmentAnalytics } from '../hooks/useAnalytics';

export const DepartmentsPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useDepartmentAnalytics();

  if (error) {
    return (
      <AnalyticsLayout
        title="Department Workload Metrics"
        subtitle="Active queues and department capacity"
      >
        <div className="bg-red-950/20 border border-red-800/40 p-6 rounded-xl text-center text-red-400">
          <p className="font-semibold mb-2">Error loading department workload</p>
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
      title="Department Workload Metrics"
      subtitle="Pending queues, capacity levels, and transaction counts per department"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KpiCard
          title="Departments Audited"
          value={data?.departments.length ?? 0}
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
          value={data?.departments.reduce((sum, d) => sum + d.pendingQueue, 0) ?? 0}
          loading={isLoading}
          icon={<span>⏳</span>}
        />
      </div>

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data?.departments.map((dept) => {
            const completedPercentage =
              dept.totalTransactions > 0
                ? Math.round((dept.completedCount / dept.totalTransactions) * 100)
                : 0;

            return (
              <div
                key={dept.departmentId}
                className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-xl space-y-4 hover:border-slate-600 transition-all"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-bold text-lg">{dept.departmentName}</h3>
                  <span className="bg-slate-900 border border-slate-700 px-3 py-1 rounded text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    {dept.departmentCode}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2">
                  <div className="text-center">
                    <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                      Pending Queue
                    </p>
                    <p className="text-white font-extrabold text-2xl mt-1">{dept.pendingQueue}</p>
                  </div>
                  <div className="text-center border-x border-slate-700/60">
                    <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                      Completed Work
                    </p>
                    <p className="text-white font-extrabold text-2xl mt-1">{dept.completedCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                      Total Indents
                    </p>
                    <p className="text-white font-extrabold text-2xl mt-1">
                      {dept.totalTransactions}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Completion rate</span>
                    <span className="text-slate-200">{completedPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      style={{ width: `${completedPercentage}%` }}
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
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
