import React from 'react';
import { useAuthStore } from '../store/authStore';
import { KPICard, QuickActionCard, DashboardWidgetCard } from '../components/ui/Cards';
import { ChartWrapper } from '../components/ui/ChartWrapper';
import { ActivityTimeline } from '../components/ui/DataTimeline';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { PriorityBadge } from '../components/ui/StatusBadges';
import { DescriptionList } from '../components/ui/DataDisplays';
import { FileText, Coins, ShieldAlert, Plus, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);
  const navigate = useNavigate();

  const kpiData = {
    activeIndents: 18,
    costLimit: '₹4,20,000',
    activeLogs: 4,
  };

  const chartData = [
    { label: 'Jan', value: 34000 },
    { label: 'Feb', value: 45000 },
    { label: 'Mar', value: 38000 },
    { label: 'Apr', value: 52000 },
    { label: 'May', value: 48000 },
    { label: 'Jun', value: 61000 },
  ];

  const timelineData = [
    {
      id: '1',
      title: 'Indent #IND-9024 Created',
      description: 'Design department dispatched a raw material specification sheet.',
      timestamp: '10 mins ago',
    },
    {
      id: '2',
      title: 'Security Alert Resolved',
      description: 'Authorized login attempt from terminal ID #029 verified.',
      timestamp: '1 hour ago',
    },
    {
      id: '3',
      title: 'Cost Audit Dispatched',
      description: 'Accounts team flagged item #M-402 for secondary audit check.',
      timestamp: '3 hours ago',
    },
  ];

  const departmentSummary = [
    { label: 'Design completed', value: <PriorityBadge priority="LOW" /> },
    {
      label: 'Stores processing queue',
      value: <span className="font-bold text-accent-primary">4 Items</span>,
    },
    { label: 'Cost audits flagged', value: <PriorityBadge priority="HIGH" /> },
    { label: 'Active environment', value: <StatusIndicator state="online" label="Secure" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="border border-border-default rounded-xl p-6 bg-surface-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Role: <span className="text-text-primary font-bold">{user?.role?.roleName}</span>{' '}
            &middot; Department:{' '}
            <span className="text-text-primary font-bold">
              {user?.department?.departmentName || 'Corporate'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span>System Environment Active</span>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="animate-slide-up delay-50">
          <KPICard
            title="Active Indents Queue"
            value={kpiData.activeIndents}
            trend="+12% this week"
            trendDirection="up"
            helperText="Dispatched to stores department"
            icon={<FileText size={16} />}
            accent="primary"
          />
        </div>
        <div className="animate-slide-up delay-150">
          <KPICard
            title="Verified Cost Budget"
            value={kpiData.costLimit}
            trend="89% threshold limit"
            trendDirection="none"
            helperText="Total approved costing sum"
            icon={<Coins size={16} />}
            accent="success"
          />
        </div>
        <div className="animate-slide-up delay-250">
          <KPICard
            title="Security Monitoring Logs"
            value={kpiData.activeLogs}
            trend="Secure"
            trendDirection="none"
            helperText="Active sessions monitored"
            icon={<ShieldAlert size={16} />}
            accent="info"
          />
        </div>
      </div>

      {/* Quick Action Links */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Quick Action Portal
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="animate-slide-up delay-100">
            <QuickActionCard
              title="Create Indent Dispatch"
              description="Initiate design specifications and dispatch request form."
              icon={<Plus size={16} />}
              onClick={() => navigate('/indents')}
            />
          </div>
          <div className="animate-slide-up delay-200">
            <QuickActionCard
              title="Accounts Costings Portal"
              description="Verify cost logs, approvals, and transaction thresholds."
              icon={<CheckCircle size={16} />}
              onClick={() => navigate('/costings')}
            />
          </div>
          <div className="animate-slide-up delay-300">
            <QuickActionCard
              title="System Security Shield"
              description="Inspect login activity histories and session control tokens."
              icon={<ArrowRight size={16} />}
              onClick={() => navigate('/security')}
            />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper title="Monthly Indent Cost Allocations" data={chartData} type="line" />
        <ChartWrapper title="Material Dispatch Volume" data={chartData} type="bar" />
      </div>

      {/* Audit Logs & Workflow summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardWidgetCard title="ERP Activity Logs Timeline" className="lg:col-span-2">
          <ActivityTimeline items={timelineData} />
        </DashboardWidgetCard>
        <DashboardWidgetCard title="Department Queue Status">
          <div className="space-y-4">
            <DescriptionList items={departmentSummary} />
            <div className="pt-2 text-center">
              <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">
                Assigned Permissions
              </span>
              <span className="text-3xl font-black text-text-primary block mt-1">
                {permissions.length}
              </span>
            </div>
          </div>
        </DashboardWidgetCard>
      </div>
    </div>
  );
};
