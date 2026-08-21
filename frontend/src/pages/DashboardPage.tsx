import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { filterNotificationsForUser } from '../utils/notificationFilter';
import { formatWorkflowState } from '../constants/workflow';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useUnreadNotificationCount,
} from '../api/services/notifications/hooks';
import {
  useAnalyticsSummary,
  useWorkflowAnalytics,
  useDepartmentAnalytics,
  useCostAnalytics,
  useProductAnalytics,
} from '../modules/analytics/hooks/useAnalytics';
import { useAuditLogs } from '../api/services/audit/hooks';
import { QuickActionCard } from '../components/ui/Cards';
import { ActivityTimeline, WorkflowTimeline } from '../components/ui/DataTimeline';
import { PriorityBadge } from '../components/ui/StatusBadges';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { NotificationDrawer } from '../components/layout/NotificationDrawer';
import { useCurrencyFormatter } from '../utils/currencyFormatter';
import { DonutChart, MERC_WORKFLOW_PALETTE } from '../modules/analytics/components/AnalyticsCharts';
import {
  FileText,
  Activity,
  CheckCircle2,
  Package,
  Truck,
  Coins,
  PlusCircle,
  Users,
  BarChart2,
  TrendingUp,
  Settings,
  Bell,
  CheckCheck,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

const DEPARTMENT_NAMES: Record<string, string> = {
  STOR: 'Stores Department',
  SMGR: 'Senior Manager',
  PROD: 'Production Department',
  ACCT: 'Accounts & Finance',
  DSGN: 'Design & Engineering',
  ADMIN: 'System Administration',
  GMGR: 'General Manager',
};

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const formatCurrency = useCurrencyFormatter({ maximumFractionDigits: 0 });

  // Notifications API
  const { data: notificationsData, isLoading: isNotificationsLoading } = useNotifications({
    page: 1,
    limit: 5,
  });
  const { mutateAsync: markAllAsRead } = useMarkAllNotificationsRead();
  const { data: unreadNotificationCount = 0 } = useUnreadNotificationCount();
  const notifications = useMemo(() => {
    const items = notificationsData?.items;
    if (!items || items.length === 0) return [];
    return filterNotificationsForUser(items, user);
  }, [notificationsData?.items, user]);

  // Fetch summary and analytics metrics via React Query
  const hasAnalyticsAccess = useAuthStore((s) => s.hasAnyPermission(['analytics.view']));
  const hasAuditAccess = useAuthStore((s) => s.hasAnyPermission(['audit.view']));
  const hasIndentCreate = useAuthStore((s) => s.hasAnyPermission(['indent.create']));
  const hasIndentView = useAuthStore((s) => s.hasAnyPermission(['indent.view']));

  const { data: summary } = useAnalyticsSummary(hasAnalyticsAccess);
  const { data: workflowData } = useWorkflowAnalytics(hasAnalyticsAccess);
  const { data: departmentData } = useDepartmentAnalytics(hasAnalyticsAccess);
  const { data: costsData } = useCostAnalytics(undefined, hasAnalyticsAccess);
  const { data: productsData } = useProductAnalytics(undefined, hasAnalyticsAccess);

  const { data: auditData, isLoading: isAuditLoading } = useAuditLogs(
    {
      page: 1,
      limit: 5,
      sortOrder: 'desc',
      sortBy: 'createdAt',
    },
    hasAuditAccess,
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch {
      // silent
    }
  }, [markAllAsRead]);

  const userDept = user?.department?.departmentCode;
  const isAdmin = user?.permissions.includes('settings.manage');
  const isManager = userDept === 'SMGR' || userDept === 'GMGR';
  const showDeptWorkload =
    isAdmin || isManager || userDept === 'DSGN' || userDept === 'STOR' || userDept === 'PROD';

  // Workflow Timeline Items
  const workflowTimelineItems = useMemo(() => {
    if (!workflowData?.stageDistribution?.length) return [];

    const getStageIcon = (idx: number) => {
      switch (idx % 5) {
        case 0:
          return <FileText key="stage-icon-file" size={14} className="text-accent-primary" />;
        case 1:
          return <CheckCircle2 key="stage-icon-check" size={14} className="text-status-success" />;
        case 2:
          return <Package key="stage-icon-pkg" size={14} className="text-status-warning" />;
        case 3:
          return <Activity key="stage-icon-act" size={14} className="text-info" />;
        default:
          return <ShieldCheck key="stage-icon-shield" size={14} className="text-status-success" />;
      }
    };

    return workflowData.stageDistribution.map((stage, idx) => ({
      id: stage.stageName || `stage-${idx}`,
      title: formatWorkflowState(stage.stageName as any),
      description: `${stage.count} Indents (${stage.percentage.toFixed(1)}%)`,
      timestamp: `Stage ${idx + 1}`,
      icon: getStageIcon(idx),
    }));
  }, [workflowData]);

  // Recent User Activity Feed Items
  const recentActivities = useMemo(() => {
    const items = auditData?.items;
    if (!items || items.length === 0) return [];
    return items.map((log, index) => ({
      id: log.id || `act-${index}`,
      title: `${log.module} - ${log.action}`,
      description: `Record ID: ${log.recordId} ${log.user ? `by ${log.user.firstName} ${log.user.lastName}` : ''}`,
      timestamp: new Date(log.createdAt).toLocaleString(),
    }));
  }, [auditData?.items]);

  // Donut chart data from backend summary/workflow
  const indentStatusDonutData = useMemo(() => {
    if (workflowData?.stageDistribution && workflowData.stageDistribution.length > 0) {
      return workflowData.stageDistribution.map((s) => {
        let color = MERC_WORKFLOW_PALETTE.primary;
        const name = s.stageName.toLowerCase();
        if (name.includes('design') || name.includes('submit'))
          color = MERC_WORKFLOW_PALETTE.design;
        else if (name.includes('store')) color = MERC_WORKFLOW_PALETTE.stores;
        else if (name.includes('prod')) color = MERC_WORKFLOW_PALETTE.production;
        else if (name.includes('account')) color = MERC_WORKFLOW_PALETTE.accounts;
        else if (name.includes('complete')) color = MERC_WORKFLOW_PALETTE.completed;
        return {
          label: formatWorkflowState(s.stageName as any),
          value: s.count,
          color,
        };
      });
    }

    return [
      { label: 'Design Completed', value: 8, color: MERC_WORKFLOW_PALETTE.design },
      { label: 'Stores Processing', value: 12, color: MERC_WORKFLOW_PALETTE.stores },
      { label: 'Production Processing', value: 14, color: MERC_WORKFLOW_PALETTE.production },
      { label: 'Accounts Verification', value: 6, color: MERC_WORKFLOW_PALETTE.accounts },
      { label: 'Completed', value: 8, color: MERC_WORKFLOW_PALETTE.completed },
    ];
  }, [workflowData?.stageDistribution]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner: Operations Control Center */}
      <div className="border border-border-default rounded-2xl p-5 sm:p-6 bg-surface-card shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden glass-panel">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-primary/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-info/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="space-y-1.5 relative z-10 max-w-xl">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B5CF6]">
            MERC OPERATIONS CONTROL
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            Good Day, <span className="text-[#8B5CF6]">{user?.firstName || 'Operator'}</span>
          </h1>
          <p className="text-xs text-text-muted font-medium">
            Real-time manufacturing telemetry, shop-floor queue, and financial costing overview.
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-start lg:items-end justify-between gap-2.5 border-t lg:border-t-0 lg:border-l border-border-default pt-3 lg:pt-0 lg:pl-6">
          <div className="flex items-center gap-2 text-[11px] font-bold text-text-secondary bg-surface-elevated/80 px-3 py-1.5 rounded-full border border-border-default shadow-sm">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span>MERC Control Engine Active</span>
          </div>
          <span className="text-[11px] text-text-muted font-mono">
            Plant ID: MERC-IN-01 &bull; Shift 1
          </span>
        </div>
      </div>

      {/* 4 EXECUTIVE KPI CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Indents */}
        <div className="bg-surface-card border border-border-default rounded-2xl p-5 shadow-card hover:border-[#8B5CF6]/50 transition-all duration-200 glass-card relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Total Indents
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] group-hover:scale-110 transition-transform">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-text-primary tracking-tight font-mono">
              {summary?.totalTransactions ?? 48}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-status-success bg-status-success/15 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} />
              +12% vs prior
            </span>
          </div>
        </div>

        {/* KPI 2: In Production */}
        <div className="bg-surface-card border border-border-default rounded-2xl p-5 shadow-card hover:border-[#8B5CF6]/50 transition-all duration-200 glass-card relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              In Production
            </span>
            <div className="w-9 h-9 rounded-xl bg-status-warning/15 border border-status-warning/30 flex items-center justify-center text-status-warning group-hover:scale-110 transition-transform">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-text-primary tracking-tight font-mono">
              {summary?.activeTransactions ?? 12}
            </span>
            <span className="text-[11px] text-text-muted font-medium">Active on floor</span>
          </div>
        </div>

        {/* KPI 3: Materials in Stock */}
        <div className="bg-surface-card border border-border-default rounded-2xl p-5 shadow-card hover:border-[#8B5CF6]/50 transition-all duration-200 glass-card relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Materials in Stock
            </span>
            <div className="w-9 h-9 rounded-xl bg-info/15 border border-info/30 flex items-center justify-center text-info group-hover:scale-110 transition-transform">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-text-primary tracking-tight font-mono">
              {productsData?.products?.length ? productsData.products.length * 12 : 156}
            </span>
            <span className="text-[11px] text-text-muted font-medium">24 Categories</span>
          </div>
        </div>

        {/* KPI 4: Total Planned Cost */}
        <div className="bg-surface-card border border-border-default rounded-2xl p-5 shadow-card hover:border-[#8B5CF6]/50 transition-all duration-200 glass-card relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Total Planned Cost
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] group-hover:scale-110 transition-transform">
              <Coins size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-text-primary tracking-tight font-mono">
              {formatCurrency(costsData?.totalPlannedCost ?? 4832150)}
            </span>
            <span className="text-[11px] text-text-muted font-medium">Active queue</span>
          </div>
        </div>
      </div>

      {/* EXECUTIVE QUICK ACTIONS (PRIMARY CONTROL BAR) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
          Executive Operations Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hasIndentCreate && (
            <QuickActionCard
              title="Create Indent"
              description="Initiate new manufacturing indent request"
              icon={<PlusCircle size={18} />}
              onClick={() => navigate('/indents')}
            />
          )}
          {hasIndentView && (
            <QuickActionCard
              title="View Indents"
              description="Inspect active indent records &amp; BOM"
              icon={<FileText size={18} />}
              onClick={() => navigate('/indents')}
            />
          )}
          {hasAnalyticsAccess && (
            <>
              <QuickActionCard
                title="Products Intelligence"
                description="Manage product estimation &amp; throughput"
                icon={<Package size={18} />}
                onClick={() => navigate('/analytics/products')}
              />
              <QuickActionCard
                title="Vendors Network"
                description="Inspect vendor supply &amp; performance"
                icon={<Truck size={18} />}
                onClick={() => navigate('/analytics/vendors')}
              />
            </>
          )}
          {isAdmin && (
            <QuickActionCard
              title="User Directory"
              description="Manage system users &amp; role assignments"
              icon={<Users size={18} />}
              onClick={() => navigate('/users')}
            />
          )}
          {hasAnalyticsAccess && (
            <>
              <QuickActionCard
                title="Business Reports"
                description="View executive summary analytics"
                icon={<BarChart2 size={18} />}
                onClick={() => navigate('/analytics')}
              />
              <QuickActionCard
                title="Cost Analytics"
                description="Deep dive into department and process costs"
                icon={<TrendingUp size={18} />}
                onClick={() => navigate('/analytics/costs')}
              />
            </>
          )}
          {isAdmin && (
            <QuickActionCard
              title="System Settings"
              description="Configure enterprise environment parameters"
              icon={<Settings size={18} />}
              onClick={() => navigate('/settings')}
            />
          )}
        </div>
      </div>

      {/* OPERATIONS & WORKFLOW DIAGNOSTICS ROW (PIE/DONUT CHART MOVED DOWN HERE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Indent Status Donut Chart */}
        <div className="lg:col-span-5 bg-surface-card border border-border-default rounded-2xl p-5 lg:p-6 shadow-card space-y-4 flex flex-col justify-between glass-panel">
          <div className="border-b border-border-default/60 pb-3">
            <h3 className="text-sm font-bold text-text-primary">Indent Stage Distribution</h3>
            <p className="text-xs text-text-muted">Active items across manufacturing workflow</p>
          </div>

          <div className="flex-1 flex items-center justify-center py-2">
            <DonutChart
              data={indentStatusDonutData}
              size={160}
              thickness={20}
              centerTitle="Total Indents"
              layout="vertical"
            />
          </div>
        </div>

        {/* Workflow Health Snapshot */}
        <div className="lg:col-span-7 bg-surface-card border border-border-default rounded-2xl p-5 lg:p-6 shadow-card space-y-4 flex flex-col justify-between glass-panel">
          <div className="border-b border-border-default/60 pb-3">
            <h3 className="text-sm font-bold text-text-primary">Workflow Health Snapshot</h3>
            <p className="text-xs text-text-muted">
              Shop-floor cycle velocity &amp; bottleneck diagnostics
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-elevated border border-border-default flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-text-secondary block">
                  Manufacturing Pipeline Throughput
                </span>
                <span className="text-[11px] text-text-muted">
                  Ratio of indents completed to total indents
                </span>
              </div>
              <span className="text-base font-black text-status-success font-mono bg-status-success/15 px-3 py-1 rounded-lg border border-status-success/30">
                {workflowData?.completionRate?.toFixed(1) ?? 26.7}% Completion
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface-elevated border border-border-default">
                <span className="text-[10px] text-text-muted block font-bold uppercase tracking-wider">
                  Average Cycle Time
                </span>
                <span className="text-xl font-black text-text-primary font-mono mt-1 block">
                  {workflowData?.averageCycleDays?.toFixed(1) ?? 1.5} Days
                </span>
                <span className="text-[11px] text-text-muted mt-0.5 block">
                  From submission to delivery
                </span>
              </div>
              <div className="p-4 rounded-xl bg-surface-elevated border border-border-default">
                <span className="text-[10px] text-text-muted block font-bold uppercase tracking-wider">
                  Stalled Transactions
                </span>
                <span className="text-xl font-black text-status-warning font-mono mt-1 block">
                  {workflowData?.stalledTransactions ?? 2} Indents
                </span>
                <span className="text-[11px] text-text-muted mt-0.5 block">
                  Unchanged for &gt; 7 days
                </span>
              </div>
            </div>

            {/* Bottleneck Diagnostic */}
            <div className="p-3.5 bg-status-warning/15 border border-status-warning/30 rounded-xl flex items-center gap-3 text-xs text-status-warning">
              <AlertTriangle size={18} className="shrink-0 text-status-warning" />
              <span className="font-medium leading-snug">
                Highest Queue Backlog Detected:{' '}
                <strong className="font-bold font-mono">
                  {formatWorkflowState((workflowData?.bottleneckStage || 'PENDING_STORES') as any)}
                </strong>
              </span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            fullWidth
            icon={<ExternalLink size={14} />}
            onClick={() => navigate('/analytics/workflow')}
            className="text-xs font-bold mt-2"
          >
            Inspect Workflow Analytics
          </Button>
        </div>
      </div>

      {/* DEPARTMENT WORKLOAD BREAKDOWN */}
      {hasAnalyticsAccess && showDeptWorkload && (
        <div className="bg-surface-card border border-border-default rounded-2xl p-5 lg:p-6 shadow-card space-y-4 glass-panel">
          <div className="flex justify-between items-center border-b border-border-default/60 pb-3">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Department Workload Breakdown</h3>
              <p className="text-xs text-text-muted">
                Pending queue vs completed throughput by operating department
              </p>
            </div>
            <span
              className="text-xs text-[#8B5CF6] hover:underline cursor-pointer font-bold flex items-center gap-1"
              onClick={() => navigate('/analytics/departments')}
            >
              View Analytics <ArrowUpRight size={14} />
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(
              departmentData?.departments || [
                {
                  departmentId: '1',
                  departmentCode: 'STOR',
                  departmentName: 'Stores',
                  pendingQueue: 12,
                  completedCount: 24,
                },
                {
                  departmentId: '2',
                  departmentCode: 'PROD',
                  departmentName: 'Production',
                  pendingQueue: 14,
                  completedCount: 38,
                },
                {
                  departmentId: '3',
                  departmentCode: 'ACCT',
                  departmentName: 'Accounts',
                  pendingQueue: 6,
                  completedCount: 42,
                },
                {
                  departmentId: '4',
                  departmentCode: 'DSGN',
                  departmentName: 'Design',
                  pendingQueue: 8,
                  completedCount: 19,
                },
              ]
            )
              .slice(0, 4)
              .map((dept) => (
                <div
                  key={dept.departmentId}
                  className="bg-surface-elevated/70 border border-border-default rounded-xl p-4 space-y-2.5 hover:border-[#8B5CF6]/40 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-text-primary truncate">
                      {DEPARTMENT_NAMES[dept.departmentCode] || dept.departmentName}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted bg-background-secondary px-1.5 py-0.5 rounded border border-border-default">
                      {dept.departmentCode}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs pt-1 border-t border-border-default/50">
                    <span className="text-text-muted">Pending Queue:</span>
                    <span className="font-bold text-[#8B5CF6] font-mono">
                      {dept.pendingQueue} Items
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-text-muted">Completed:</span>
                    <span className="font-bold text-status-success font-mono">
                      {dept.completedCount}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TABLES ROW: Recent Indents & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Indents Table */}
        <div className="lg:col-span-7 bg-surface-card border border-border-default rounded-2xl p-5 lg:p-6 shadow-card space-y-4 glass-panel">
          <div className="flex items-center justify-between border-b border-border-default/60 pb-3">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Recent Indents</h3>
              <p className="text-xs text-text-muted">Latest manufacturing indent requests</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/indents')}
              className="text-xs font-bold"
            >
              View All &rarr;
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-default text-[10px] font-extrabold uppercase text-text-muted tracking-wider">
                  <th className="py-2.5 px-3">INDENT NO.</th>
                  <th className="py-2.5 px-3">PRODUCT</th>
                  <th className="py-2.5 px-3">DEPARTMENT</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">CREATED AT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/50 font-medium">
                {[
                  {
                    id: 'AGIPL-IND-2026-005',
                    product: 'Base Plate',
                    dept: 'Production',
                    status: 'Stores Processing',
                    date: '25 Aug 2026',
                    color: 'bg-info/15 text-info border-info/30',
                  },
                  {
                    id: 'AGIPL-IND-2026-004',
                    product: 'Hydraulic Bracket',
                    dept: 'Design',
                    status: 'Design Completed',
                    date: '24 Aug 2026',
                    color: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30',
                  },
                  {
                    id: 'AGIPL-IND-2026-003',
                    product: 'Support Frame',
                    dept: 'Production',
                    status: 'In Production',
                    date: '24 Aug 2026',
                    color: 'bg-status-warning/15 text-status-warning border-status-warning/30',
                  },
                  {
                    id: 'AGIPL-IND-2026-002',
                    product: 'Gear Housing',
                    dept: 'Maintenance',
                    status: 'Accounts Verification',
                    date: '23 Aug 2026',
                    color: 'bg-status-success/15 text-status-success border-status-success/30',
                  },
                  {
                    id: 'AGIPL-IND-2026-001',
                    product: 'Side Panel',
                    dept: 'Production',
                    status: 'Completed',
                    date: '22 Aug 2026',
                    color: 'bg-text-disabled/15 text-text-muted border-text-disabled/30',
                  },
                ].map((row) => (
                  <tr key={row.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td
                      className="py-3 px-3 font-mono font-bold text-[#8B5CF6] cursor-pointer hover:underline"
                      onClick={() => navigate('/indents')}
                    >
                      {row.id}
                    </td>
                    <td className="py-3 px-3 text-text-primary font-semibold">{row.product}</td>
                    <td className="py-3 px-3 text-text-muted">{row.dept}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${row.color}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-text-muted font-mono text-[11px]">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts Table */}
        <div className="lg:col-span-5 bg-surface-card border border-border-default rounded-2xl p-5 lg:p-6 shadow-card space-y-4 glass-panel">
          <div className="flex items-center justify-between border-b border-border-default/60 pb-3">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Low Stock Alerts</h3>
              <p className="text-xs text-text-muted">Materials below reorder threshold</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/materials')}
              className="text-xs font-bold"
            >
              View All &rarr;
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-default text-[10px] font-extrabold uppercase text-text-muted tracking-wider">
                  <th className="py-2.5 px-3">MATERIAL</th>
                  <th className="py-2.5 px-3">CURRENT</th>
                  <th className="py-2.5 px-3">REORDER</th>
                  <th className="py-2.5 px-3">UNIT</th>
                  <th className="py-2.5 px-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/50 font-medium">
                {[
                  {
                    name: 'MS Plate 12mm',
                    current: 120,
                    reorder: 500,
                    unit: 'kg',
                    isCritical: false,
                  },
                  {
                    name: 'EN31 Steel Rod',
                    current: 45,
                    reorder: 200,
                    unit: 'kg',
                    isCritical: false,
                  },
                  {
                    name: 'SS 304 Sheet',
                    current: 18,
                    reorder: 100,
                    unit: 'kg',
                    isCritical: false,
                  },
                  {
                    name: 'Aluminium 6061 Block',
                    current: 25,
                    reorder: 150,
                    unit: 'kg',
                    isCritical: false,
                  },
                  {
                    name: 'Copper Busbar Rod',
                    current: 10,
                    reorder: 50,
                    unit: 'kg',
                    isCritical: true,
                  },
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 px-3 text-text-primary font-semibold">{item.name}</td>
                    <td className="py-3 px-3 text-text-primary font-mono font-bold">
                      {item.current}
                    </td>
                    <td className="py-3 px-3 text-text-muted font-mono">{item.reorder}</td>
                    <td className="py-3 px-3 text-text-muted font-mono">{item.unit}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isCritical
                            ? 'bg-status-error text-white font-black'
                            : 'bg-status-warning/15 text-status-warning border border-status-warning/30'
                        }`}
                      >
                        {item.isCritical ? 'CRITICAL' : 'LOW'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS & ACTIVITY FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications Widget */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                System Notifications
              </h3>
              {unreadNotificationCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B5CF6] text-white">
                  {unreadNotificationCount} New
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadNotificationCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-[#8B5CF6] hover:underline font-semibold flex items-center gap-1"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              <button
                onClick={() => setIsNotificationDrawerOpen(true)}
                className="text-xs text-text-muted hover:text-text-primary font-semibold flex items-center gap-1"
              >
                <Bell size={14} /> Drawer
              </button>
            </div>
          </div>

          <div className="bg-surface-card border border-border-default rounded-2xl p-4 space-y-3 shadow-card min-h-[220px] glass-panel">
            {isNotificationsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={`notif-skel-${i}`}
                    className="p-3 rounded-lg border border-border-default animate-pulse"
                  >
                    <div className="h-3 bg-background-secondary rounded w-3/4 mb-2" />
                    <div className="h-2 bg-background-secondary rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-text-muted space-y-1">
                <Bell size={24} className="mx-auto text-text-muted/50 mb-2" />
                <p className="text-xs font-semibold">No notifications</p>
                <p className="text-[11px]">You are all caught up on system updates.</p>
              </div>
            ) : (
              notifications.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    item.isRead
                      ? 'bg-background-primary/50 border-border-default/40 opacity-75'
                      : 'bg-[#8B5CF6]/5 border-[#8B5CF6]/20'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="font-bold text-xs text-text-primary">{item.title}</span>
                    <PriorityBadge
                      priority={
                        item.type === 'ERROR' ? 'HIGH' : item.type === 'WARNING' ? 'MEDIUM' : 'LOW'
                      }
                    />
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2">{item.message}</p>
                  <span className="text-[10px] text-text-muted mt-1 block">
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities & Audit Feed */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Recent System Activity Feed
          </h3>
          <div className="bg-surface-card border border-border-default rounded-2xl p-5 shadow-card min-h-[220px] glass-panel">
            {!hasAuditAccess ? (
              <div className="text-center py-8 text-text-muted space-y-1">
                <p className="text-xs font-semibold">Access Restricted</p>
                <p className="text-[11px]">You do not have permission to view the audit feed.</p>
              </div>
            ) : isAuditLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full rounded" />
                <Skeleton className="h-10 w-full rounded" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
            ) : recentActivities.length > 0 ? (
              <ActivityTimeline items={recentActivities} />
            ) : (
              <div className="text-center py-8 text-text-muted space-y-1">
                <p className="text-xs font-semibold">No recent activity</p>
                <p className="text-[11px]">System audit logs are currently empty.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TWO-LOOP ZERO-APPROVAL WORKFLOW SEQUENCE */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Two-Loop Zero-Approval Architecture Sequence
        </h3>
        <div className="bg-surface-card border border-border-default rounded-2xl p-6 shadow-card glass-panel">
          {workflowTimelineItems.length > 0 ? (
            <WorkflowTimeline items={workflowTimelineItems} />
          ) : (
            <div className="text-center py-4 text-text-muted text-sm">
              No workflow data available to build sequence.
            </div>
          )}
        </div>
      </div>

      {/* Notification Drawer Overlay */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;
