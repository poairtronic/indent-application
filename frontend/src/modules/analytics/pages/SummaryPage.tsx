import React, { useState, useCallback, useMemo } from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import {
  DonutChart,
  BarChart,
  RankedHorizontalBarChart,
  GroupedCostBarChart,
  MERC_WORKFLOW_PALETTE,
} from '../components/AnalyticsCharts';
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
import { useCurrencyFormatter } from '../../../utils/currencyFormatter';

const DEPARTMENT_NAMES: Record<string, string> = {
  STOR: 'Stores Department',
  SMGR: 'Senior Manager',
  PROD: 'Production Department',
  ACCT: 'Accounts & Finance',
  DSGN: 'Design & Engineering',
  ADMIN: 'System Administration',
  GMGR: 'General Manager',
};

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
  general: 'General & Manufacturing Metrics',
  financial: 'Cost & Financial Analytics',
  workflow: 'Workflow Queue State',
  performance: 'Performance & Velocity',
};

function groupKpis(kpis: IKpiData[]): Record<string, IKpiData[]> {
  const groups: Record<string, IKpiData[]> = {
    general: [],
    financial: [],
    workflow: [],
    performance: [],
  };
  if (!Array.isArray(kpis)) return groups;
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
  const formatCurrency = useCurrencyFormatter({ maximumFractionDigits: 0 });

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

  const chartData = useMemo(() => {
    if (!summaryData?.statusBreakdown?.length) return [];
    return summaryData.statusBreakdown.map((item) => {
      let color = MERC_WORKFLOW_PALETTE.primary;
      const s = item.status.toLowerCase();
      if (s.includes('design') || s.includes('submit')) color = MERC_WORKFLOW_PALETTE.design;
      else if (s.includes('store')) color = MERC_WORKFLOW_PALETTE.stores;
      else if (s.includes('prod')) color = MERC_WORKFLOW_PALETTE.production;
      else if (s.includes('account')) color = MERC_WORKFLOW_PALETTE.accounts;
      else if (s.includes('complete')) color = MERC_WORKFLOW_PALETTE.completed;
      return {
        label: formatWorkflowState(item.status as any),
        value: item.count,
        color,
      };
    });
  }, [summaryData]);

  const workflowChartData = useMemo(
    () =>
      workflowData?.stageDistribution?.map((item) => ({
        label: formatWorkflowState(item.stageName as any),
        value: item.count,
        color: MERC_WORKFLOW_PALETTE.primary,
      })) ?? [],
    [workflowData],
  );

  const groupedCostChartData = useMemo(
    () =>
      costData
        ? [
            {
              label: 'Overall Portfolio',
              planned: costData.totalPlannedCost,
              actual: costData.totalActualCost,
            },
          ]
        : [],
    [costData],
  );

  const deptChartData = useMemo(
    () =>
      deptData?.departments?.map((item) => ({
        label: DEPARTMENT_NAMES[item.departmentCode] || item.departmentName,
        value: item.pendingQueue,
        subValue: `${item.completedCount} Done`,
        color: '#8B5CF6',
      })) ?? [],
    [deptData],
  );

  const productChartData = useMemo(
    () =>
      productData?.products?.map((item) => ({
        label: item.productName || item.productCode,
        value: item.indentCount,
        subValue: `${item.indentCount} Indents`,
        color: '#38BDF8',
      })) ?? [],
    [productData],
  );

  const vendorChartData = useMemo(
    () =>
      vendorData?.vendors?.map((item) => ({
        label: item.vendorName || item.vendorCode,
        value: item.totalPredictedAmount,
        subValue: formatCurrency(item.totalPredictedAmount),
        color: '#10B981',
      })) ?? [],
    [vendorData, formatCurrency],
  );

  const kpis: IKpiData[] = Array.isArray(kpiData) ? kpiData : [];
  const grouped = groupKpis(kpis);
  const hasActiveFilters = Object.values(appliedFilters).some((v) => v);

  if (hasError) {
    const errorMessage =
      (summaryError as any)?.message ||
      (kpiError as any)?.message ||
      (costError as any)?.message ||
      (workflowError as any)?.message ||
      'Error loading analytics data';

    return (
      <AnalyticsLayout
        title="Enterprise Analytics Dashboard"
        subtitle="Live Operations & Financial KPI Engine"
      >
        <ErrorState
          message={errorMessage}
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
      subtitle="Aggregated manufacturing operations & costing BI engine — live PostgreSQL telemetry"
    >
      {/* ── Filter Bar ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-text-primary font-bold text-base">Executive KPI Dashboard</h2>
            {hasActiveFilters && (
              <span className="bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#8B5CF6]/30">
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
              className="text-xs font-bold"
            >
              {showFilters ? 'Hide Filters' : '⚙ Filter KPIs'}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="danger"
                size="sm"
                id="reset-kpi-filters"
                onClick={handleReset}
                className="text-xs font-bold"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="bg-surface-card border border-border-default rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 shadow-card glass-panel">
            <div className="flex flex-col gap-1.5">
              <label className="text-text-muted text-xs font-bold uppercase tracking-wider">
                From Date
              </label>
              <input
                id="kpi-filter-from"
                type="date"
                value={filters.dateFrom ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))
                }
                className="bg-background-primary border border-border-default rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-[#8B5CF6] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-text-muted text-xs font-bold uppercase tracking-wider">
                To Date
              </label>
              <input
                id="kpi-filter-to"
                type="date"
                value={filters.dateTo ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
                className="bg-background-primary border border-border-default rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-[#8B5CF6] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-text-muted text-xs font-bold uppercase tracking-wider">
                Status
              </label>
              <select
                id="kpi-filter-status"
                value={filters.status ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
                className="bg-background-primary border border-border-default rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-[#8B5CF6] transition-colors"
              >
                {INDENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2 pt-2 border-t border-border-default/60">
              <Button
                variant="secondary"
                size="sm"
                id="kpi-filter-reset-btn"
                onClick={handleReset}
                className="text-xs font-bold"
              >
                Reset
              </Button>
              <Button
                variant="primary"
                size="sm"
                id="kpi-filter-apply-btn"
                onClick={handleApply}
                className="text-xs font-bold"
              >
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
            <h3 className="text-text-secondary font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
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
          <div className="bg-surface-elevated border-l-4 border-[#8B5CF6] p-6 rounded-r-2xl shadow-card glass-panel">
            <h3 className="text-text-primary font-bold text-base mb-2 flex items-center gap-2">
              <span>💡</span> Executive Operations Diagnostic Summary
            </h3>
            <p className="text-text-secondary text-xs sm:text-sm leading-relaxed font-medium">
              {insightsData.summaryText}
            </p>
          </div>

          <div className="bg-surface-card border border-border-default p-6 rounded-2xl shadow-card glass-panel">
            <div className="flex justify-between items-center mb-5 border-b border-border-default/60 pb-3">
              <div>
                <h3 className="text-text-primary font-bold text-base">
                  Deterministic Business &amp; Cost Insights
                </h3>
                <p className="text-text-muted text-xs mt-0.5">
                  Rule-based variance calculations, trend observations, and queue alerts.
                </p>
              </div>
              <span className="text-[10px] text-text-muted font-mono bg-surface-elevated px-2.5 py-1 rounded border border-border-default">
                Live Monolith Stream
              </span>
            </div>

            {insightsData.insights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insightsData.insights.map((insight: any, idx: number) => {
                  const severityStyles: Record<string, string> = {
                    CRITICAL: 'bg-status-error/10 border-status-error/30 text-status-error',
                    WARNING: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
                    SUCCESS: 'bg-status-success/10 border-status-success/30 text-status-success',
                    INFO: 'bg-surface-elevated border-border-default text-text-primary',
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
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <span>{insight.title}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-text-secondary">
                          {insight.message}
                        </p>
                      </div>

                      {isTrend && (
                        <div className="flex justify-between items-center border-t border-border-default/50 pt-2 mt-auto text-xs font-semibold text-text-muted">
                          <span>Change %</span>
                          <span
                            className={`flex items-center gap-1 font-mono font-bold ${
                              insight.severity === 'CRITICAL'
                                ? 'text-status-error'
                                : insight.severity === 'WARNING'
                                  ? 'text-status-warning'
                                  : insight.severity === 'SUCCESS'
                                    ? 'text-status-success'
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
                  title="No Active Operational Alerts"
                  description="Insufficient historical variance or stable parameters across current bounds."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Visual Analytics Row 1 ──────────────────────────────────── */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-surface-card border border-border-default p-6 rounded-2xl shadow-card glass-panel">
            <h3 className="text-text-primary font-bold text-base mb-1">
              Transaction Status Distribution
            </h3>
            <p className="text-text-muted text-xs mb-4">
              Distribution of indents across all statuses in the system.
            </p>
            {chartData.length > 0 ? (
              <DonutChart data={chartData} centerTitle="Total Indents" />
            ) : (
              <EmptyState title="No Data" description="No status records found." />
            )}
          </div>

          {hasWorkflowAccess && (
            <div className="bg-surface-card border border-border-default p-6 rounded-2xl shadow-card glass-panel">
              <h3 className="text-text-primary font-bold text-base mb-1">
                Workflow Stage Distribution
              </h3>
              <p className="text-text-muted text-xs mb-4">
                Total active indent volume tracked across operational workflow stages.
              </p>
              {workflowChartData.length > 0 ? (
                <BarChart data={workflowChartData} color="#8B5CF6" />
              ) : (
                <EmptyState title="No Data" description="No workflow records found." />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Visual Analytics Row 2: Financial Costs & Department Workload ── */}
      {!isLoading && (hasFinancialAccess || isAdmin || isManager) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {hasFinancialAccess && (
            <div className="bg-surface-card border border-border-default p-6 rounded-2xl shadow-card glass-panel">
              <h3 className="text-text-primary font-bold text-base mb-1">
                Planned vs. Actual Costs (INR)
              </h3>
              <p className="text-text-muted text-xs mb-4">
                Aggregate planned values vs finalized actual costing entries.
              </p>
              {costData && (costData.totalPlannedCost > 0 || costData.totalActualCost > 0) ? (
                <GroupedCostBarChart data={groupedCostChartData} formatCurrency={formatCurrency} />
              ) : (
                <EmptyState
                  title="No Data"
                  description="No costing records found for this period."
                />
              )}
            </div>
          )}

          {(isAdmin || isManager) && (
            <div className="bg-surface-card border border-border-default p-6 rounded-2xl shadow-card glass-panel">
              <h3 className="text-text-primary font-bold text-base mb-1">
                Department Pending Workload
              </h3>
              <p className="text-text-muted text-xs mb-4">
                Current volume of pending indents in active queues per operating department.
              </p>
              {deptChartData.length > 0 ? (
                <RankedHorizontalBarChart data={deptChartData} />
              ) : (
                <EmptyState title="No Data" description="No pending department items." />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Visual Analytics Row 3: Products & Vendors ──────────────────── */}
      {!isLoading && (hasFinancialAccess || isAdmin || isManager) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {(isAdmin || isManager) && (
            <div className="bg-surface-card border border-border-default p-6 rounded-2xl shadow-card glass-panel">
              <h3 className="text-text-primary font-bold text-base mb-1">
                Top Products by Indent Volume
              </h3>
              <p className="text-text-muted text-xs mb-4">
                Configured manufacturing products ranked by frequency of indent requests.
              </p>
              {productChartData.length > 0 ? (
                <RankedHorizontalBarChart data={productChartData} />
              ) : (
                <EmptyState title="No Data" description="No product indents recorded." />
              )}
            </div>
          )}

          {hasFinancialAccess && (
            <div className="bg-surface-card border border-border-default p-6 rounded-2xl shadow-card glass-panel">
              <h3 className="text-text-primary font-bold text-base mb-1">
                Vendor Supply Value Allocation (INR)
              </h3>
              <p className="text-text-muted text-xs mb-4">
                Top-5 supply vendors ranked by aggregate planned procurement value.
              </p>
              {vendorChartData.length > 0 ? (
                <RankedHorizontalBarChart data={vendorChartData} />
              ) : (
                <EmptyState title="No Data" description="No vendor transactions recorded." />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Two-Loop Architecture Passive Monitoring Footer ────────────────── */}
      {!isLoading && (
        <div className="bg-surface-card border border-border-default p-6 rounded-2xl shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-6 glass-panel">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-text-primary font-bold text-sm sm:text-base">
              Two-Loop Zero-Approval Architecture Passive Monitoring
            </h3>
            <p className="text-text-muted text-xs leading-relaxed">
              Operational and financial flows run autonomously. State transitions trigger
              email/system notifications to stakeholders. Senior &amp; General Managers passively
              monitor progress and analyze performance indicators without blocking active workflows.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold pt-1">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
                <span className="text-text-secondary">
                  Loop 1 (Manufacturing): Design &rarr; Stores &rarr; Production &rarr; Delivery
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
                <span className="text-text-secondary">
                  Loop 2 (Financial): Accounts &rarr; Closure &rarr; Archive &rarr; Complete
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end text-xs text-text-muted font-mono border-t md:border-t-0 border-border-default pt-3 md:pt-0 w-full md:w-auto">
            <span>Source: PostgreSQL Monolith Live</span>
            <span>
              Timestamp:{' '}
              {summaryData?.generatedAt
                ? new Date(summaryData.generatedAt).toLocaleTimeString()
                : 'Live'}
            </span>
          </div>
        </div>
      )}
    </AnalyticsLayout>
  );
};

export default SummaryPage;
