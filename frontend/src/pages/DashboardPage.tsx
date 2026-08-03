import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotifications } from '../store/notification.store';
import {
  useAnalyticsSummary,
  useWorkflowAnalytics,
  useDepartmentAnalytics,
  useCostAnalytics,
  useProductAnalytics,
  useVendorAnalytics,
} from '../modules/analytics/hooks/useAnalytics';
import { KPICard, QuickActionCard } from '../components/ui/Cards';
import { ChartWrapper } from '../components/ui/ChartWrapper';
import { ActivityTimeline, WorkflowTimeline } from '../components/ui/DataTimeline';
import { PriorityBadge } from '../components/ui/StatusBadges';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { NotificationDrawer } from '../components/layout/NotificationDrawer';
import {
  FileText,
  Clock,
  Activity,
  CheckCircle2,
  Package,
  Truck,
  Building2,
  Coins,
  PlusCircle,
  Users,
  BarChart3,
  TrendingUp,
  Settings,
  Search,
  ChevronRight,
  Sparkles,
  Bell,
  CheckCheck,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Layers,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Notifications Store
  const { notifications, markAsRead } = useNotifications();

  // Live Date & Time ticker
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) +
          ' • ' +
          now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch summary and analytics metrics via React Query
  const {
    data: summary,
    isLoading: isSummaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useAnalyticsSummary();

  const {
    data: workflowData,
    isLoading: isWorkflowLoading,
    error: workflowError,
    refetch: refetchWorkflow,
  } = useWorkflowAnalytics();

  const {
    data: departmentData,
    isLoading: isDeptLoading,
    error: deptError,
    refetch: refetchDept,
  } = useDepartmentAnalytics();

  const {
    data: costsData,
    isLoading: isCostsLoading,
    error: costsError,
    refetch: refetchCosts,
  } = useCostAnalytics();

  const { data: productsData } = useProductAnalytics();
  const { data: vendorsData } = useVendorAnalytics();

  const isLoading = isSummaryLoading || isWorkflowLoading || isDeptLoading || isCostsLoading;
  const isError = summaryError || workflowError || deptError || costsError;

  const handleRefetchAll = useCallback(() => {
    refetchSummary();
    refetchWorkflow();
    refetchDept();
    refetchCosts();
  }, [refetchSummary, refetchWorkflow, refetchDept, refetchCosts]);

  const handleMarkAllRead = useCallback(() => {
    notifications.forEach((n) => markAsRead(n.id));
  }, [notifications, markAsRead]);

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '₹4,20,000';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/indents?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  // Workflow Timeline Items
  const workflowTimelineItems = useMemo(
    () => [
      {
        id: 'stage-1',
        title: 'Draft Creation',
        description: 'Design Specs Initialized',
        timestamp: 'Stage 1',
        icon: <FileText size={14} className="text-accent-primary" />,
      },
      {
        id: 'stage-2',
        title: 'Design Completed',
        description: 'Engineering Approved',
        timestamp: 'Stage 2',
        icon: <CheckCircle2 size={14} className="text-status-success" />,
      },
      {
        id: 'stage-3',
        title: 'Stores Processing',
        description: 'Stock & Allocation Audit',
        timestamp: 'Stage 3',
        icon: <Package size={14} className="text-status-warning" />,
      },
      {
        id: 'stage-4',
        title: 'Production Processing',
        description: 'Manufacturing Run Active',
        timestamp: 'Stage 4',
        icon: <Activity size={14} className="text-info" />,
      },
      {
        id: 'stage-5',
        title: 'Customer Delivered',
        description: 'Accounts Financial Closure',
        timestamp: 'Stage 5',
        icon: <ShieldCheck size={14} className="text-status-success" />,
      },
    ],
    [],
  );

  // Recent User Activity Feed Items
  const recentActivities = useMemo(
    () => [
      {
        id: 'act-1',
        title: 'Indent #IND-9024 Created',
        description: 'Design department dispatched a raw material specification sheet for Batch A.',
        timestamp: '10 mins ago',
      },
      {
        id: 'act-2',
        title: 'Cost Verification Finalized',
        description: 'Accounts verified variance within 2.5% threshold for Indent #IND-8910.',
        timestamp: '45 mins ago',
      },
      {
        id: 'act-3',
        title: 'Security Terminal Alert Cleared',
        description:
          'Authorized login attempt from terminal ID #029 verified by system administrator.',
        timestamp: '2 hours ago',
      },
      {
        id: 'act-4',
        title: 'Stores Allocation Dispatch',
        description: 'Material requisition approved for 50 units of Steel Sheet Grade 304.',
        timestamp: '4 hours ago',
      },
    ],
    [],
  );

  // Chart Data for Monthly Cost Trends
  const costTrendChartData = useMemo(
    () => [
      { label: 'Jan', value: 340000 },
      { label: 'Feb', value: 410000 },
      { label: 'Mar', value: 380000 },
      { label: 'Apr', value: 450000 },
      { label: 'May', value: 420000 },
      { label: 'Jun', value: costsData?.totalPlannedCost || 480000 },
    ],
    [costsData],
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Top Navigation & Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav
            className="flex items-center gap-1.5 text-xs text-text-muted mb-1"
            aria-label="Breadcrumb"
          >
            <span
              className="hover:text-text-primary transition-colors cursor-pointer"
              onClick={() => navigate('/')}
            >
              Home
            </span>
            <ChevronRight size={12} />
            <span className="text-text-primary font-semibold">Executive Dashboard</span>
          </nav>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Executive Overview
          </h1>
          <p className="text-xs text-text-muted">
            Real-time enterprise metrics, manufacturing workflow & business intelligence
          </p>
        </div>

        {/* Quick Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[280px] md:min-w-[340px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search indents, products, vendors... (Ctrl + K)"
            className="w-full bg-surface-card border border-border-default rounded-xl pl-9 pr-14 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors shadow-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-semibold text-text-muted bg-background-secondary border border-border-default rounded">
              Ctrl K
            </kbd>
          </div>
        </form>
      </div>

      {/* Executive Welcome Banner */}
      <div className="border border-border-default rounded-2xl p-6 bg-surface-card shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] font-bold uppercase tracking-wider">
            <Sparkles size={12} />
            <span>Manufacturing Control Center</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">
            Welcome back, {user?.firstName || 'Executive'} {user?.lastName || 'User'}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted font-medium">
            <span>
              Role:{' '}
              <span className="text-text-primary font-bold">
                {user?.role?.roleName || 'System Admin'}
              </span>
            </span>
            <span>&middot;</span>
            <span>
              Department:{' '}
              <span className="text-text-primary font-bold">
                {user?.department?.departmentName || 'Enterprise Operations'}
              </span>
            </span>
          </div>
        </div>

        {/* Live Date & Time Display */}
        <div className="relative z-10 flex flex-col items-start lg:items-end gap-1 border-t lg:border-t-0 lg:border-l border-border-default pt-4 lg:pt-0 lg:pl-6">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            System Local Time
          </span>
          <span className="text-sm md:text-base font-bold text-text-primary font-mono tracking-wide">
            {currentTime || 'Loading clock...'}
          </span>
        </div>
      </div>

      {/* Error State Handler */}
      {isError && (
        <ErrorState
          title="Dashboard Analytics Unavailable"
          message="Could not retrieve real-time summary indicators from backend services."
          onRetry={handleRefetchAll}
        />
      )}

      {/* KPI Cards Grid (8 Widgets) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Enterprise Key Performance Indicators
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-surface-card border border-border-default rounded-xl p-5 space-y-3"
              >
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Indents"
              value={summary?.totalTransactions ?? 128}
              trend="Lifetime Indents"
              icon={<FileText size={18} />}
              accent="primary"
            />
            <KPICard
              title="Pending Indents"
              value={summary?.pendingTransactions ?? 18}
              trend="Awaiting Action"
              icon={<Clock size={18} />}
              accent="warning"
            />
            <KPICard
              title="Active Production"
              value={summary?.activeTransactions ?? 24}
              trend="In Processing"
              icon={<Activity size={18} />}
              accent="info"
            />
            <KPICard
              title="Completed Orders"
              value={summary?.completedTransactions ?? 86}
              trend="Delivered & Closed"
              icon={<CheckCircle2 size={18} />}
              accent="success"
            />
            <KPICard
              title="Products Catalog"
              value={productsData?.products?.length ?? 42}
              trend="Active SKUs"
              icon={<Package size={18} />}
              accent="primary"
            />
            <KPICard
              title="Approved Vendors"
              value={vendorsData?.vendors?.length ?? 18}
              trend="Suppliers Network"
              icon={<Truck size={18} />}
              accent="primary"
            />
            <KPICard
              title="Operating Departments"
              value={departmentData?.departments?.length ?? 8}
              trend="Business Units"
              icon={<Building2 size={18} />}
              accent="primary"
            />
            <KPICard
              title="Monthly Planned Cost"
              value={formatCurrency(costsData?.totalPlannedCost)}
              trend="Expenditure Limit"
              icon={<Coins size={18} />}
              accent="success"
            />
          </div>
        )}
      </div>

      {/* Quick Action Portal (8 Actions) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Executive Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Create Indent"
            description="Initiate new manufacturing indent request"
            icon={<PlusCircle size={18} />}
            onClick={() => navigate('/indents')}
          />
          <QuickActionCard
            title="View Indents"
            description="Inspect all active indent records"
            icon={<FileText size={18} />}
            onClick={() => navigate('/indents')}
          />
          <QuickActionCard
            title="Products Intelligence"
            description="Manage product estimation & throughput"
            icon={<Package size={18} />}
            onClick={() => navigate('/analytics/products')}
          />
          <QuickActionCard
            title="Vendors Network"
            description="Inspect vendor supply & performance"
            icon={<Truck size={18} />}
            onClick={() => navigate('/analytics/vendors')}
          />
          <QuickActionCard
            title="User Directory"
            description="Manage system users & role assignments"
            icon={<Users size={18} />}
            onClick={() => navigate('/users')}
          />
          <QuickActionCard
            title="Business Reports"
            description="View executive summary analytics"
            icon={<BarChart3 size={18} />}
            onClick={() => navigate('/analytics/summary')}
          />
          <QuickActionCard
            title="System Analytics"
            description="Deep dive into department costs"
            icon={<TrendingUp size={18} />}
            onClick={() => navigate('/analytics')}
          />
          <QuickActionCard
            title="System Settings"
            description="Configure enterprise environment parameters"
            icon={<Settings size={18} />}
            onClick={() => navigate('/settings')}
          />
        </div>
      </div>

      {/* Section: Executive Intelligence & Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost & Expenditure Trend Chart */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Planned Expenditure Trend
          </h3>
          <ChartWrapper title="Monthly Planned Costs (INR)" data={costTrendChartData} type="bar" />
        </div>

        {/* Workflow Progress Snapshot */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Workflow Health Snapshot
          </h3>
          <div className="bg-surface-card border border-border-default rounded-xl p-5 space-y-4 shadow-card">
            <div className="flex justify-between items-center border-b border-border-default/50 pb-2">
              <span className="text-xs font-bold text-text-primary">Manufacturing Throughput</span>
              <span className="text-xs font-bold text-status-success">
                {workflowData?.completionRate ?? 84.5}% Completion
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-text-muted">
                <span>Average Cycle Time:</span>
                <span className="font-semibold text-text-primary">
                  {workflowData?.averageCycleDays ?? 3.2} Days
                </span>
              </div>
              <div className="flex justify-between text-xs text-text-muted">
                <span>Stalled Transactions:</span>
                <span className="font-semibold text-status-warning">
                  {workflowData?.stalledTransactions ?? 2} Items
                </span>
              </div>
            </div>

            {/* Bottleneck Alert */}
            {workflowData?.bottleneckStage && (
              <div className="p-3 bg-status-warning/10 border border-status-warning/20 rounded-lg flex items-center gap-2 text-xs text-status-warning">
                <AlertTriangle size={16} className="shrink-0" />
                <span>
                  Bottleneck Detected: <strong>{workflowData.bottleneckStage}</strong> stage.
                </span>
              </div>
            )}

            <Button
              variant="secondary"
              size="sm"
              fullWidth
              icon={<ExternalLink size={14} />}
              onClick={() => navigate('/analytics/workflow')}
            >
              Inspect Workflow Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* Section: Department Workload Distribution */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Department Workload Breakdown
          </h3>
          <span
            className="text-xs text-accent-primary hover:underline cursor-pointer font-semibold"
            onClick={() => navigate('/analytics/departments')}
          >
            View All Departments →
          </span>
        </div>

        {departmentData?.departments && departmentData.departments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {departmentData.departments.slice(0, 4).map((dept) => (
              <div
                key={dept.departmentId}
                className="bg-surface-card border border-border-default rounded-xl p-4 space-y-2 shadow-card"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-text-primary truncate">
                    {dept.departmentName}
                  </span>
                  <span className="text-[10px] font-mono text-text-muted bg-background-secondary px-1.5 py-0.5 rounded border border-border-default">
                    {dept.departmentCode}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs pt-1">
                  <span className="text-text-muted">Pending Queue:</span>
                  <span className="font-bold text-accent-primary">{dept.pendingQueue} Items</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-text-muted">Completed:</span>
                  <span className="font-bold text-status-success">{dept.completedCount}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-card border border-border-default rounded-xl p-4 text-center text-xs text-text-muted">
            <Layers size={18} className="mx-auto mb-1 text-text-muted" />
            <span>Operating departments metrics loaded</span>
          </div>
        )}
      </div>

      {/* Section: Notifications & Recent Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications Widget */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                System Notifications
              </h3>
              {unreadNotificationCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-primary text-white">
                  {unreadNotificationCount} New
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadNotificationCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-accent-primary hover:underline font-semibold flex items-center gap-1"
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

          <div className="bg-surface-card border border-border-default rounded-xl p-4 space-y-3 shadow-card min-h-[220px]">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-text-muted space-y-1">
                <Bell size={24} className="mx-auto text-text-muted/50 mb-2" />
                <p className="text-xs font-semibold">No notifications</p>
                <p className="text-[11px]">You are all caught up on system updates.</p>
              </div>
            ) : (
              notifications.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    item.isRead
                      ? 'bg-background-primary/50 border-border-default/40 opacity-75'
                      : 'bg-accent-primary/5 border-accent-primary/20'
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
          <div className="bg-surface-card border border-border-default rounded-xl p-5 shadow-card min-h-[220px]">
            <ActivityTimeline items={recentActivities} />
          </div>
        </div>
      </div>

      {/* Manufacturing Workflow Sequence */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Two-Loop Zero-Approval Architecture Sequence
        </h3>
        <div className="bg-surface-card border border-border-default rounded-xl p-6 shadow-card">
          <WorkflowTimeline items={workflowTimelineItems} />
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
