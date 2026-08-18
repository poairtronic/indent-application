import React, { useState, useCallback, useMemo } from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { DonutChart, BarChart, HorizontalBarChart } from '../components/AnalyticsCharts';
import {
  useAnalyticsSummary,
  useKpis,
  useWorkflowAnalytics,
  useDepartmentAnalytics,
  useCostAnalytics,
  useProductAnalytics,
  useVendorAnalytics,
  useInsights,
} from '../hooks/useAnalytics';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';
import type { IKpiData } from '../types/analytics.types';
import { useAuthStore } from '../../../store/authStore';
import { formatWorkflowState } from '../../../constants/workflow';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatKpiValue(kpi: IKpiData): string {
  const { value, unit } = kpi;
  if (unit === 'currency') return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  if (unit === 'percentage') return `${value.toFixed(2)}%`;
  if (unit === 'hours') return `${value} hrs`;
  return value.toLocaleString('en-IN');
}

function kpiAccent(kpi: IKpiData): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  if (kpi.status === 'critical') return 'danger';
  if (kpi.status === 'warning') return 'warning';
  if (kpi.unit === 'currency') return 'info';
  if (kpi.id.includes('completed')) return 'success';
  return 'primary';
}

function kpiIcon(kpi: IKpiData): React.ReactNode {
  const icons: Record<string, string> = {
    'total-indents': '📋',
    'active-indents': '🔄',
    'completed-indents': '✅',
    'production-in-progress': '⚙️',
    'total-planned-cost': '💰',
    'total-actual-cost': '💵',
    'total-variance': '📊',
    'average-planned-cost': '🧮',
    'average-actual-cost': '🧾',
    'cost-variance-pct': '📉',
    'total-material-cost': '🏗️',
    'total-process-cost': '🔧',
    'draft-transactions': '📝',
    'design-pending': '🎨',
    'stores-pending': '📦',
    'production-pending': '🏭',
    'accounts-pending': '🧾',
    'archived-transactions': '🗄️',
    'avg-workflow-duration': '⏱️',
    'avg-stores-time': '🏬',
    'avg-accounts-time': '💼',
  };
  return <span>{icons[kpi.id] ?? '📌'}</span>;
}

// ── Filter state ────────────────────────────────────────────────────────────

interface KpiFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

const INDENT_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Design Completed' },
  { value: 'PENDING_STORES', label: 'Stores Processing' },
  { value: 'IN_PRODUCTION', label: 'Production Processing' },
  { value: 'APPROVED', label: 'Customer Delivered' },
  { value: 'PENDING_ACCOUNTS', label: 'Accounts Cost Verification' },
  { value: 'PENDING_SENIOR_MANAGER', label: 'Accounts Financial Closure' },
  { value: 'COMPLETED', label: 'Completed' },
];

// ── KPI Group Labels ────────────────────────────────────────────────────────

const GROUP_ORDER = ['general', 'financial', 'workflow', 'performance'];
const GROUP_LABELS: Record<string, string> = {
  general: '📈 General & Manufacturing',
  financial: '💰 Cost & Financial',
  workflow: '🔀 Workflow Queue',
  performance: '⏱️ Performance Metrics',
};

function groupKpis(kpis: IKpiData[]): Record<string, IKpiData[]> {
  const groups: Record<string, IKpiData[]> = {
    general: [],
    financial: [],
    workflow: [],
    performance: [],
  };
  kpis.forEach((kpi) => {
    if (
      ['total-indents', 'active-indents', 'completed-indents', 'production-in-progress'].includes(
        kpi.id,
      )
    ) {
      groups.general.push(kpi);
    } else if (
      kpi.id.startsWith('total-') ||
      kpi.id.startsWith('average-') ||
      kpi.id === 'cost-variance-pct'
    ) {
      groups.financial.push(kpi);
    } else if (
      [
        'draft-transactions',
        'design-pending',
        'stores-pending',
        'production-pending',
        'accounts-pending',
        'archived-transactions',
      ].includes(kpi.id)
    ) {
      groups.workflow.push(kpi);
    } else {
      groups.performance.push(kpi);
    }
  });
  return groups;
}

// ── Main Component ──────────────────────────────────────────────────────────

export const SummaryPage: React.FC = () => {
  const [filters, setFilters] = useState<KpiFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<KpiFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const user = useAuthStore((s) => s.user);
  const deptCode = user?.department?.departmentCode;
  const isAdmin = user?.permissions?.includes('settings.manage');
  const isManager = deptCode === 'SMGR' || deptCode === 'GMGR';
  const hasFinancialAccess = !!(isAdmin || isManager || deptCode === 'ACCT');
  const hasWorkflowAccess = !!(isAdmin || isManager || deptCode === 'DSGN' || deptCode === 'STOR');

  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useAnalyticsSummary();

  const {
    data: kpiData,
    isLoading: kpiLoading,
    error: kpiError,
    refetch: refetchKpis,
  } = useKpis(
    Object.fromEntries(
      Object.entries(appliedFilters).filter(([, v]) => v !== undefined && v !== ''),
    ),
  );

  const {
    data: workflowData,
    isLoading: workflowLoading,
    error: workflowError,
    refetch: refetchWorkflow,
  } = useWorkflowAnalytics(hasWorkflowAccess);

  const {
    data: deptData,
    isLoading: deptLoading,
    error: deptError,
    refetch: refetchDept,
  } = useDepartmentAnalytics(!!(isAdmin || isManager));

  const {
    data: costData,
    isLoading: costLoading,
    error: costError,
    refetch: refetchCosts,
  } = useCostAnalytics(appliedFilters, hasFinancialAccess);

  const {
    data: productData,
    isLoading: productLoading,
    error: productError,
    refetch: refetchProducts,
  } = useProductAnalytics({ limit: 5 }, !!(isAdmin || isManager));

  const {
    data: vendorData,
    isLoading: vendorLoading,
    error: vendorError,
    refetch: refetchVendors,
  } = useVendorAnalytics({ limit: 5 }, hasFinancialAccess);

  const {
    data: insightsData,
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights,
  } = useInsights(
    Object.fromEntries(
      Object.entries(appliedFilters).filter(([, v]) => v !== undefined && v !== ''),
    ),
  );

  const handleApply = useCallback(() => {
    setAppliedFilters({ ...filters });
  }, [filters]);

  const handleReset = useCallback(() => {
    setFilters({});
    setAppliedFilters({});
  }, []);

  const isLoading =
    summaryLoading ||
    kpiLoading ||
    insightsLoading ||
    (hasWorkflowAccess && workflowLoading) ||
    (!!(isAdmin || isManager) && deptLoading) ||
    (hasFinancialAccess && costLoading) ||
    (!!(isAdmin || isManager) && productLoading) ||
    (hasFinancialAccess && vendorLoading);

  const hasError =
    !!summaryError ||
    !!kpiError ||
    !!insightsError ||
    (hasWorkflowAccess && !!workflowError) ||
    (!!(isAdmin || isManager) && !!deptError) ||
    (hasFinancialAccess && !!costError) ||
    (!!(isAdmin || isManager) && !!productError) ||
    (hasFinancialAccess && !!vendorError);

  const chartData = useMemo(
    () =>
      summaryData?.statusBreakdown?.map((item) => ({
        label: item.status,
        value: item.count,
      })) ?? [],
    [summaryData],
  );

  const workflowChartData = useMemo(
    () =>
      workflowData?.stageDistribution?.map((item) => ({
        label: formatWorkflowState(item.stageName as any),
        value: item.count,
      })) ?? [],
    [workflowData],
  );

  const costChartData = useMemo(
    () =>
      costData
        ? [
            { label: 'Planned Cost', value: costData.totalPlannedCost },
            { label: 'Actual Cost', value: costData.totalActualCost },
          ]
        : [],
    [costData],
  );

  const deptChartData = useMemo(
    () =>
      deptData?.departments?.map((item) => ({
        label: item.departmentCode,
        value: item.pendingQueue,
      })) ?? [],
    [deptData],
  );

  const productChartData = useMemo(
    () =>
      productData?.products?.map((item) => ({
        label: item.productCode,
        value: item.indentCount,
      })) ?? [],
    [productData],
  );

  const vendorChartData = useMemo(
    () =>
      vendorData?.vendors?.map((item) => ({
        label: item.vendorCode,
        value: item.totalPredictedAmount,
      })) ?? [],
    [vendorData],
  );

  const kpis: IKpiData[] = kpiData ?? [];
  const grouped = groupKpis(kpis);
  const hasActiveFilters = Object.values(appliedFilters).some((v) => v);

  if (hasError) {
    return (
      <AnalyticsLayout title="Enterprise Analytics Dashboard" subtitle="Live KPI Engine">
        <ErrorState
          message="Error loading analytics data"
          onRetry={() => {
            void refetchSummary();
            void refetchKpis();
            void refetchInsights();
            if (hasWorkflowAccess) void refetchWorkflow();
            if (isAdmin || isManager) void refetchDept();
            if (hasFinancialAccess) void refetchCosts();
            if (isAdmin || isManager) void refetchProducts();
            if (hasFinancialAccess) void refetchVendors();
          }}
        />
      </AnalyticsLayout>
    );
  }

  return (
    <AnalyticsLayout
      title="Enterprise Analytics Dashboard"
      subtitle="Aggregated KPI engine — all values sourced from live PostgreSQL database"
    >
      {/* ── Filter Bar ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-text-primary font-semibold text-base">KPI Dashboard</h2>
            {hasActiveFilters && (
              <span className="bg-accent-primary/20 text-accent-primary text-xs font-bold px-2 py-0.5 rounded-full">
                Filters Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              id="toggle-kpi-filters"
              onClick={() => setShowFilters((v) => !v)}
            >
              {showFilters ? 'Hide Filters' : '⚙ Filter KPIs'}
            </Button>
            {hasActiveFilters && (
              <Button variant="danger" size="sm" id="reset-kpi-filters" onClick={handleReset}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="bg-surface-card border border-border-default rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 shadow-card">
            <div className="flex flex-col gap-1.5">
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider">
                From Date
              </label>
              <input
                id="kpi-filter-from"
                type="date"
                value={filters.dateFrom ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))
                }
                className="bg-background-primary border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider">
                To Date
              </label>
              <input
                id="kpi-filter-to"
                type="date"
                value={filters.dateTo ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
                className="bg-background-primary border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider">
                Status
              </label>
              <select
                id="kpi-filter-status"
                value={filters.status ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
                className="bg-background-primary border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-colors"
              >
                {INDENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <Button variant="secondary" size="sm" id="kpi-filter-reset-btn" onClick={handleReset}>
                Reset
              </Button>
              <Button variant="primary" size="sm" id="kpi-filter-apply-btn" onClick={handleApply}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── KPI Groups ─────────────────────────────────────────────── */}
      {GROUP_ORDER.map((group) => {
        const items = grouped[group];
        if (items.length === 0 && !isLoading) return null;

        return (
          <div key={group} className="mb-8">
            <h3 className="text-text-secondary font-bold text-sm uppercase tracking-widest mb-3">
              {GROUP_LABELS[group]}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoading
                ? Array.from({ length: group === 'general' ? 4 : 3 }).map((_, i) => (
                    <KpiCard key={i} title="" value={0} loading />
                  ))
                : items.map((kpi) => (
                    <KpiCard
                      key={kpi.id}
                      title={kpi.label}
                      value={formatKpiValue(kpi)}
                      icon={kpiIcon(kpi)}
                      accent={kpiAccent(kpi)}
                      loading={false}
                      subtitle={kpi.comparisonPeriod}
                      trend={
                        kpi.trendPercentage !== 0
                          ? {
                              value: `${kpi.trendPercentage > 0 ? '+' : ''}${kpi.trendPercentage}%`,
                              isPositive: kpi.trend === 'up',
                            }
                          : undefined
                      }
                    />
                  ))}
            </div>
          </div>
        );
      })}

      {/* ── Business Insights Section ────────────────────────────────── */}
      {!isLoading && insightsData && (
        <div className="mb-8 space-y-6">
          <div className="bg-surface-elevated border-l-4 border-accent-primary p-6 rounded-r-xl shadow-sm">
            <h3 className="text-text-primary font-bold text-lg mb-2 flex items-center gap-2">
              <span>💡</span> Deterministic Executive Summary
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed font-medium">
              {insightsData.summaryText}
            </p>
          </div>

          <div className="bg-surface-card border border-border-default p-6 rounded-xl shadow-card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-text-primary font-bold text-lg">
                  Deterministic Business Insights
                </h3>
                <p className="text-text-muted text-xs mt-1">
                  Rule-based variance calculations, trend observations, and queue highlights.
                </p>
              </div>
              <span className="text-xs text-text-disabled font-mono">Live Data Feed</span>
            </div>

            {insightsData.insights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insightsData.insights.map((insight: any, idx: number) => {
                  const severityStyles: Record<string, string> = {
                    CRITICAL: 'bg-red-50/20 border-red-500 text-red-700 dark:text-red-400',
                    WARNING: 'bg-amber-50/20 border-amber-500 text-amber-700 dark:text-amber-400',
                    SUCCESS: 'bg-green-50/20 border-green-500 text-green-700 dark:text-green-400',
                    INFO: 'bg-slate-50/10 border-border-default text-text-primary',
                  };

                  const severityIcons: Record<string, string> = {
                    CRITICAL: '🚨',
                    WARNING: '⚠️',
                    SUCCESS: '✅',
                    INFO: 'ℹ️',
                  };

                  const isTrend =
                    insight.changePercentage !== null && insight.changePercentage !== undefined;
                  const isPositive = insight.direction === 'up';

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-3 shadow-sm ${
                        severityStyles[insight.severity] || severityStyles.INFO
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <span>{severityIcons[insight.severity] || '📌'}</span>
                          <span>{insight.title}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-text-secondary">
                          {insight.message}
                        </p>
                      </div>

                      {isTrend && (
                        <div className="flex justify-between items-center border-t border-border-default pt-2 mt-auto text-xs font-semibold text-text-muted">
                          <span>Change %</span>
                          <span
                            className={`flex items-center gap-1 ${
                              insight.severity === 'CRITICAL'
                                ? 'text-red-600'
                                : insight.severity === 'WARNING'
                                  ? 'text-amber-600'
                                  : insight.severity === 'SUCCESS'
                                    ? 'text-green-600'
                                    : 'text-text-secondary'
                            }`}
                          >
                            {isPositive ? '▲' : '▼'} {Math.abs(Number(insight.changePercentage))}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8">
                <EmptyState
                  title="No Active Alerts"
                  description="Insufficient historical data or stable parameters across current bounds."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Visual Analytics Row 1 ──────────────────────────────────── */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-surface-card border border-border-default p-6 rounded-xl shadow-card">
            <h3 className="text-text-primary font-bold text-base mb-2">
              Transaction Status Distribution
            </h3>
            <p className="text-text-muted text-xs mb-4">
              Distribution of indents across all statuses in the system.
            </p>
            {chartData.length > 0 ? (
              <DonutChart data={chartData} />
            ) : (
              <EmptyState title="No Data" description="No status records found." />
            )}
          </div>

          {hasWorkflowAccess && (
            <div className="bg-surface-card border border-border-default p-6 rounded-xl shadow-card">
              <h3 className="text-text-primary font-bold text-base mb-2">
                Workflow Stage Distribution
              </h3>
              <p className="text-text-muted text-xs mb-4">
                Total active indent volume tracked across operational workflow stages.
              </p>
              {workflowChartData.length > 0 ? (
                <BarChart data={workflowChartData} color="var(--primary)" />
              ) : (
                <EmptyState title="No Data" description="No workflow records found." />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Visual Analytics Row 2 ──────────────────────────────────── */}
      {!isLoading && (hasFinancialAccess || isAdmin || isManager) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {hasFinancialAccess && (
            <div className="bg-surface-card border border-border-default p-6 rounded-xl shadow-card">
              <h3 className="text-text-primary font-bold text-base mb-2">
                Planned vs. Actual Costs (INR)
              </h3>
              <p className="text-text-muted text-xs mb-4">
                Aggregate planned values vs finalized actual costing entries.
              </p>
              {costData && (costData.totalPlannedCost > 0 || costData.totalActualCost > 0) ? (
                <BarChart
                  data={costChartData}
                  color="var(--success)"
                  formatValue={(val) => '₹' + val.toLocaleString('en-IN')}
                />
              ) : (
                <EmptyState
                  title="No Data"
                  description="No costing records found for this period."
                />
              )}
            </div>
          )}

          {(isAdmin || isManager) && (
            <div className="bg-surface-card border border-border-default p-6 rounded-xl shadow-card">
              <h3 className="text-text-primary font-bold text-base mb-2">
                Department Pending Workload
              </h3>
              <p className="text-text-muted text-xs mb-4">
                Current volume of pending indents in active queues per department.
              </p>
              {deptChartData.length > 0 ? (
                <BarChart data={deptChartData} color="var(--warning)" />
              ) : (
                <EmptyState title="No Data" description="No pending department items." />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Visual Analytics Row 3 ──────────────────────────────────── */}
      {!isLoading && (hasFinancialAccess || isAdmin || isManager) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {(isAdmin || isManager) && (
            <div className="bg-surface-card border border-border-default p-6 rounded-xl shadow-card">
              <h3 className="text-text-primary font-bold text-base mb-2">
                Top Products by Indent Volume
              </h3>
              <p className="text-text-muted text-xs mb-4">
                Configured products ranked by frequency of indent requests.
              </p>
              {productChartData.length > 0 ? (
                <HorizontalBarChart data={productChartData} color="var(--primary)" />
              ) : (
                <EmptyState title="No Data" description="No product indents recorded." />
              )}
            </div>
          )}

          {hasFinancialAccess && (
            <div className="bg-surface-card border border-border-default p-6 rounded-xl shadow-card">
              <h3 className="text-text-primary font-bold text-base mb-2">
                Vendor Supply Value Allocation (INR)
              </h3>
              <p className="text-text-muted text-xs mb-4">
                Top-5 vendors ranked by aggregate planned supply value.
              </p>
              {vendorChartData.length > 0 ? (
                <HorizontalBarChart
                  data={vendorChartData}
                  color="var(--info)"
                  formatValue={(val) => '₹' + val.toLocaleString('en-IN')}
                />
              ) : (
                <EmptyState title="No Data" description="No vendor transactions recorded." />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Two-Loop Architecture info & Refresh Footer ────────────────── */}
      {!isLoading && (
        <div className="bg-surface-card border border-border-default p-6 rounded-xl shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-6">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-text-primary font-bold text-base">
              Two-Loop Zero-Approval Architecture Passive Monitoring
            </h3>
            <p className="text-text-muted text-xs leading-relaxed">
              Operational and financial flows run autonomously. State transitions trigger
              email/system notifications to stakeholders. Senior & General Managers passively
              monitor progress and analyze performance indicators without blocking active workflows.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold pt-1">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent-primary" />
                <span className="text-text-secondary">
                  Loop 1 (Manufacturing): Design → Stores → Production → Delivery
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent-info" />
                <span className="text-text-secondary">
                  Loop 2 (Financial): Accounts → Closure → Archive → Complete
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end text-xs text-text-disabled font-semibold border-t md:border-t-0 border-border-default pt-3 md:pt-0 w-full md:w-auto">
            <span>Source: PostgreSQL Live Monolithic DB</span>
            <span>
              Last Aggregated:{' '}
              {summaryData?.generatedAt
                ? new Date(summaryData.generatedAt).toLocaleString()
                : 'N/A'}
            </span>
          </div>
        </div>
      )}
    </AnalyticsLayout>
  );
};
