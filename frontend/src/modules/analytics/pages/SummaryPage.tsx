import React, { useState, useCallback } from 'react';
import { AnalyticsLayout } from '../components/AnalyticsLayout';
import { KpiCard } from '../components/AnalyticsCards';
import { DonutChart } from '../components/AnalyticsCharts';
import { useAnalyticsSummary, useKpis } from '../hooks/useAnalytics';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';
import type { IKpiData } from '../types/analytics.types';

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

  const handleApply = useCallback(() => {
    setAppliedFilters({ ...filters });
  }, [filters]);

  const handleReset = useCallback(() => {
    setFilters({});
    setAppliedFilters({});
  }, []);

  const isLoading = summaryLoading || kpiLoading;
  const hasError = summaryError || kpiError;

  if (hasError) {
    return (
      <AnalyticsLayout title="Enterprise Analytics Dashboard" subtitle="Live KPI Engine">
        <ErrorState
          message="Error loading analytics data"
          onRetry={() => {
            void refetchSummary();
            void refetchKpis();
          }}
        />
      </AnalyticsLayout>
    );
  }

  const chartData =
    summaryData?.statusBreakdown?.map((item) => ({
      label: item.status,
      value: item.count,
    })) ?? [];

  const kpis: IKpiData[] = kpiData ?? [];
  const grouped = groupKpis(kpis);
  const hasActiveFilters = Object.values(appliedFilters).some((v) => v);

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

      {/* ── Status Distribution Chart ───────────────────────────────── */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
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
                Two-Loop Zero-Approval Architecture
              </h3>
              <p className="text-text-muted text-sm leading-relaxed mb-4">
                Senior Managers &amp; General Managers monitor operations through this dashboard.
                State changes trigger automated notifications — no manual approval is required.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent-primary" />
                  <span className="text-text-secondary font-medium">Loop 1 — Manufacturing</span>
                </div>
                <p className="text-text-muted text-xs ml-4">
                  Draft → Design Completed → Stores Processing → Production → Customer Delivered
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="h-2 w-2 rounded-full bg-accent-info" />
                  <span className="text-text-secondary font-medium">Loop 2 — Financial</span>
                </div>
                <p className="text-text-muted text-xs ml-4">
                  Accounts Cost Verification → Financial Closure → Archived → Completed
                </p>
              </div>
            </div>
            <div className="border-t border-border-default pt-4 mt-6 flex justify-between items-center text-xs text-text-disabled font-medium">
              <span>Data source: Live PostgreSQL Database</span>
              <span>
                Refreshed:{' '}
                {summaryData?.generatedAt
                  ? new Date(summaryData.generatedAt).toLocaleTimeString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </AnalyticsLayout>
  );
};
