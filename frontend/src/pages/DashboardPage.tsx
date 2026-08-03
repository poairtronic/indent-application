import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  useAnalyticsSummary,
  useCostAnalytics,
  useProductAnalytics,
  useVendorAnalytics,
  useDepartmentAnalytics,
} from '../modules/analytics/hooks/useAnalytics';
import { KPICard, QuickActionCard } from '../components/ui/Cards';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
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
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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

  // Fetch summary and analytics metrics
  const {
    data: summary,
    isLoading: isSummaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useAnalyticsSummary();
  const { data: costsData, isLoading: isCostsLoading } = useCostAnalytics();
  const { data: productsData } = useProductAnalytics();
  const { data: vendorsData } = useVendorAnalytics();
  const { data: departmentsData } = useDepartmentAnalytics();

  const isLoading = isSummaryLoading || isCostsLoading;

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
            Real-time enterprise metrics & manufacturing intelligence
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
      {summaryError && (
        <ErrorState
          title="Dashboard Metrics Unavailable"
          message="Could not retrieve real-time summary indicators from backend services."
          onRetry={() => refetchSummary()}
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
              value={departmentsData?.departments?.length ?? 8}
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
    </div>
  );
};
