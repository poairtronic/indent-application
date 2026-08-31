import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../api/client';
import { Badge } from '../components/ui/Badge';
import {
  Activity,
  Database,
  RefreshCw,
  AlertOctagon,
  Clock,
  Mail,
  Shield,
  History,
} from 'lucide-react';

interface MetricData {
  systemHealth: {
    app: string;
    database: string;
    queue: string; // PostgreSQL-backed queue (replaces Redis)
  };
  apiMetrics: {
    totalRequests: number;
    successRequests: number;
    errorRequests: number;
    errorRate: number;
    averageLatencyMs: number;
    p95Ms: number;
    p99Ms: number;
    statusCodes: Record<number, number>;
    slowRequestsHistory: Array<{
      method: string;
      url: string;
      duration: number;
      statusCode: number;
      timestamp: string;
    }>;
  };
  databaseMetrics: {
    totalQueries: number;
    successQueries: number;
    failedQueries: number;
    slowQueriesCount: number;
    averageLatencyMs: number;
    p95Ms: number;
    p99Ms: number;
    failuresHistory: Array<{
      model: string;
      action: string;
      duration: number;
      error: string;
      timestamp: string;
    }>;
    slowQueriesHistory: Array<{
      model: string;
      action: string;
      duration: number;
      timestamp: string;
    }>;
  };
  redisMetrics: {
    connected: boolean;
    cacheHits: number;
    cacheMisses: number;
    hitRatePercentage: number;
    totalOps: number;
    successOps: number;
    errorOps: number;
    averageLatencyMs: number;
    p95Ms: number;
    errorsHistory: Array<{
      error: string;
      timestamp: string;
    }>;
  };
  workflowMetrics: {
    totalTransitions: number;
    successTransitions: number;
    failedTransitions: number;
    invalidTransitions: number;
    averageDurationMs: number;
    history: Array<{
      fromState: string;
      toState: string;
      success: boolean;
      duration: number;
      error?: string;
      timestamp: string;
    }>;
  };
  authMetrics: {
    loginSuccess: number;
    loginFailure: number;
    refreshSuccess: number;
    refreshFailure: number;
    logout: number;
    sessionRevocations: number;
  };
  notificationMetrics: {
    created: number;
    delivered: number;
    failed: number;
    retried: number;
    queueFailures: number;
    unreadErrors: number;
  };
  frontendErrors: {
    totalErrors: number;
    history: Array<{
      type: string;
      message: string;
      stack: string;
      url: string;
      timestamp: string;
    }>;
  };
}

export const MonitoringDashboardPage: React.FC = () => {
  const { data, isLoading, error, refetch, isFetching } = useQuery<{
    success: boolean;
    data: MetricData;
  }>({
    queryKey: ['monitoringMetrics'],
    queryFn: () => get<any>('/observability/metrics'),
    refetchInterval: 30000, // automatic live refresh every 30 seconds
  });

  const metrics = data?.data;

  const renderHealthIndicator = useCallback((serviceName: string, status?: string) => {
    const isUp = status === 'UP';
    return (
      <div className="flex items-center justify-between p-4 bg-background-primary/50 border border-border-default/50 rounded-xl">
        <span className="text-sm font-semibold text-text-secondary">{serviceName}</span>
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${isUp ? 'bg-status-success animate-pulse' : 'bg-status-error'}`}
          />
          <span
            className={`text-xs font-bold ${isUp ? 'text-status-success' : 'text-status-error'}`}
          >
            {status || 'UNKNOWN'}
          </span>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-border-default pb-4">
        <h1 className="text-xl font-bold text-text-primary">System Monitoring</h1>
        <p className="text-xs text-text-secondary">
          Real-time operational diagnostics and observability telemetry
        </p>
      </div>
      {/* Header toolbar */}
      <div className="flex justify-between items-center bg-surface-card border border-border-default rounded-xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Telemetry Controls
          </h2>
          <p className="text-xs text-text-secondary">Dashboard auto-updates every 5 seconds</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="flex items-center gap-2 px-3 py-1.5 bg-background-secondary border border-border-default hover:border-border-strong text-text-primary rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Force Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center bg-surface-card border border-border-default rounded-xl shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={28} className="text-accent-primary animate-spin" />
            <span className="text-sm text-text-secondary">Loading system health metrics...</span>
          </div>
        </div>
      ) : error || !metrics ? (
        <div className="p-8 text-center bg-status-error/5 border border-status-error/20 rounded-xl shadow-sm">
          <AlertOctagon size={48} className="mx-auto text-status-error mb-3" />
          <h3 className="text-lg font-bold text-text-primary mb-2">Metrics Fetch Failed</h3>
          <p className="text-sm text-text-secondary mb-4">
            {error instanceof Error
              ? error.message
              : 'Could not establish connection to the observability API.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-accent-primary text-white font-medium rounded-lg text-sm transition-all"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* Top row: Health Statuses */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface-card border border-border-default rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-accent-primary">
                <Activity size={20} />
                <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">
                  Health Status
                </h3>
              </div>
              <div className="space-y-2">
                {renderHealthIndicator('Core Node', metrics.systemHealth.app)}
                {renderHealthIndicator('Database Engine', metrics.systemHealth.database)}
                {/* Queue is PostgreSQL-backed; no Redis in this architecture */}
                {renderHealthIndicator('Email Queue (PG)', metrics.systemHealth.queue)}
              </div>
            </div>

            {/* API Diagnostics summary */}
            <div className="bg-surface-card border border-border-default rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-indigo-500">
                <Clock size={20} />
                <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">
                  API Latency
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl">
                  <span className="text-[10px] text-text-muted uppercase font-bold">
                    AVG Response
                  </span>
                  <span className="block text-xl font-mono font-bold text-text-primary mt-1">
                    {metrics.apiMetrics.averageLatencyMs}ms
                  </span>
                </div>
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl">
                  <span className="text-[10px] text-text-muted uppercase font-bold">
                    P95 / P99 Limit
                  </span>
                  <span className="block text-xl font-mono font-bold text-text-primary mt-1">
                    {metrics.apiMetrics.p95Ms}ms / {metrics.apiMetrics.p99Ms}ms
                  </span>
                </div>
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl">
                  <span className="text-[10px] text-text-muted uppercase font-bold">
                    Total Requests
                  </span>
                  <span className="block text-xl font-mono font-bold text-text-primary mt-1">
                    {metrics.apiMetrics.totalRequests}
                  </span>
                </div>
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl">
                  <span className="text-[10px] text-text-muted uppercase font-bold">
                    Errors rate
                  </span>
                  <span
                    className={`block text-xl font-mono font-bold mt-1 ${metrics.apiMetrics.errorRate > 5 ? 'text-status-error' : 'text-status-success'}`}
                  >
                    {metrics.apiMetrics.errorRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Cache cluster metrics */}
            {/* Email Queue (PostgreSQL-backed — Redis removed) */}
            <div className="bg-surface-card border border-border-default rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-teal-500">
                <Mail size={20} />
                <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">
                  Email Queue (PG)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl col-span-2 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase font-bold">
                      Delivery Rate
                    </span>
                    <span className="block text-2xl font-mono font-bold text-teal-400 mt-1">
                      {metrics.notificationMetrics.created > 0
                        ? Math.round(
                            (metrics.notificationMetrics.delivered /
                              metrics.notificationMetrics.created) *
                              100,
                          )
                        : 100}
                      %
                    </span>
                  </div>
                  <Badge
                    tone={
                      metrics.notificationMetrics.failed > 0
                        ? 'yellow'
                        : 'green'
                    }
                  >
                    {metrics.notificationMetrics.failed > 0 ? 'Degraded' : 'Healthy'}
                  </Badge>
                </div>
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl">
                  <span className="text-[10px] text-text-muted uppercase font-bold">
                    Delivered
                  </span>
                  <span className="block text-lg font-mono font-bold text-status-success mt-1">
                    {metrics.notificationMetrics.delivered}
                  </span>
                </div>
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl">
                  <span className="text-[10px] text-text-muted uppercase font-bold">
                    Failed
                  </span>
                  <span
                    className={`block text-lg font-mono font-bold mt-1 ${metrics.notificationMetrics.failed > 0 ? 'text-status-error' : 'text-text-primary'}`}
                  >
                    {metrics.notificationMetrics.failed}
                  </span>
                </div>
              </div>
            </div>

            {/* DB Query load diagnostics */}
            <div className="bg-surface-card border border-border-default rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-500">
                <Database size={20} />
                <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">
                  Database Load
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl">
                  <span className="text-[10px] text-text-muted uppercase font-bold">
                    Total Queries
                  </span>
                  <span className="block text-lg font-mono font-bold text-text-primary mt-1">
                    {metrics.databaseMetrics.totalQueries}
                  </span>
                </div>
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl">
                  <span className="text-[10px] text-text-muted uppercase font-bold">
                    Slow Queries
                  </span>
                  <span
                    className={`block text-lg font-mono font-bold mt-1 ${metrics.databaseMetrics.slowQueriesCount > 0 ? 'text-status-warning' : 'text-text-primary'}`}
                  >
                    {metrics.databaseMetrics.slowQueriesCount}
                  </span>
                </div>
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl">
                  <span className="text-[10px] text-text-muted uppercase font-bold">
                    Queries AVG
                  </span>
                  <span className="block text-lg font-mono font-bold text-text-primary mt-1">
                    {metrics.databaseMetrics.averageLatencyMs}ms
                  </span>
                </div>
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl">
                  <span className="text-[10px] text-text-muted uppercase font-bold">
                    Query Failures
                  </span>
                  <span
                    className={`block text-lg font-mono font-bold mt-1 ${metrics.databaseMetrics.failedQueries > 0 ? 'text-status-error font-bold' : 'text-status-success'}`}
                  >
                    {metrics.databaseMetrics.failedQueries}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow and Notifications Diagnostics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workflow stage validations */}
            <div className="bg-surface-card border border-border-default rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-indigo-500">
                <Shield size={20} />
                <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">
                  Workflow Transitions
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl text-center">
                  <span className="text-[9px] text-text-muted uppercase font-bold">
                    Total Attempts
                  </span>
                  <span className="block text-lg font-mono font-bold mt-1">
                    {metrics.workflowMetrics.totalTransitions}
                  </span>
                </div>
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl text-center">
                  <span className="text-[9px] text-text-muted uppercase font-bold">Successful</span>
                  <span className="block text-lg font-mono font-bold text-status-success mt-1">
                    {metrics.workflowMetrics.successTransitions}
                  </span>
                </div>
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl text-center">
                  <span className="text-[9px] text-text-muted uppercase font-bold">
                    Validation Fails
                  </span>
                  <span className="block text-lg font-mono font-bold text-status-warning mt-1">
                    {metrics.workflowMetrics.failedTransitions}
                  </span>
                </div>
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl text-center">
                  <span className="text-[9px] text-text-muted uppercase font-bold">
                    Illegal Attempts
                  </span>
                  <span className="block text-lg font-mono font-bold text-status-error mt-1">
                    {metrics.workflowMetrics.invalidTransitions}
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Worker statistics */}
            <div className="bg-surface-card border border-border-default rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-500">
                <Mail size={20} />
                <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">
                  Notification Dispatch Queue
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl text-center">
                  <span className="text-[9px] text-text-muted uppercase font-bold">
                    Jobs Created
                  </span>
                  <span className="block text-lg font-mono font-bold mt-1">
                    {metrics.notificationMetrics.created}
                  </span>
                </div>
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl text-center">
                  <span className="text-[9px] text-text-muted uppercase font-bold">Completed</span>
                  <span className="block text-lg font-mono font-bold text-status-success mt-1">
                    {metrics.notificationMetrics.delivered}
                  </span>
                </div>
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl text-center">
                  <span className="text-[9px] text-text-muted uppercase font-bold">
                    SMTP Retries
                  </span>
                  <span className="block text-lg font-mono font-bold text-status-warning mt-1">
                    {metrics.notificationMetrics.retried}
                  </span>
                </div>
                <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl text-center">
                  <span className="text-[9px] text-text-muted uppercase font-bold">
                    DLQ Failures
                  </span>
                  <span className="block text-lg font-mono font-bold text-status-error mt-1">
                    {metrics.notificationMetrics.failed}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Authentication telemetry */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-rose-500">
              <History size={20} />
              <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">
                Access Telemetry
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl text-center">
                <span className="text-[10px] text-text-muted uppercase font-bold">Login OK</span>
                <span className="block text-lg font-mono font-bold text-status-success mt-1">
                  {metrics.authMetrics.loginSuccess}
                </span>
              </div>
              <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl text-center">
                <span className="text-[10px] text-text-muted uppercase font-bold">Login Fails</span>
                <span
                  className={`block text-lg font-mono font-bold mt-1 ${metrics.authMetrics.loginFailure > 0 ? 'text-status-warning' : 'text-text-primary'}`}
                >
                  {metrics.authMetrics.loginFailure}
                </span>
              </div>
              <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl text-center">
                <span className="text-[10px] text-text-muted uppercase font-bold">Refresh OK</span>
                <span className="block text-lg font-mono font-bold text-text-primary mt-1">
                  {metrics.authMetrics.refreshSuccess}
                </span>
              </div>
              <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl text-center">
                <span className="text-[10px] text-text-muted uppercase font-bold">
                  Refresh Fails
                </span>
                <span className="block text-lg font-mono font-bold text-text-primary mt-1">
                  {metrics.authMetrics.refreshFailure}
                </span>
              </div>
              <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl text-center">
                <span className="text-[10px] text-text-muted uppercase font-bold">
                  Logout calls
                </span>
                <span className="block text-lg font-mono font-bold text-text-primary mt-1">
                  {metrics.authMetrics.logout}
                </span>
              </div>
              <div className="bg-background-primary/45 p-3 border border-border-default/50 rounded-xl text-center">
                <span className="text-[10px] text-text-muted uppercase font-bold">
                  Revoked Sessions
                </span>
                <span className="block text-lg font-mono font-bold text-text-primary mt-1">
                  {metrics.authMetrics.sessionRevocations}
                </span>
              </div>
            </div>
          </div>

          {/* Slow Requests & Client Crashes log streams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slow HTTP requests */}
            <div className="bg-surface-card border border-border-default rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-status-warning" />
                Recent Slow API requests
              </h3>
              <div className="border border-border-default rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-background-secondary text-text-secondary font-semibold border-b border-border-default">
                      <tr>
                        <th className="py-2 px-3">Method</th>
                        <th className="py-2 px-3">Endpoint</th>
                        <th className="py-2 px-3 text-right">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default/40">
                      {metrics.apiMetrics.slowRequestsHistory.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-text-muted">
                            No slow requests logged. Status optimal.
                          </td>
                        </tr>
                      ) : (
                        metrics.apiMetrics.slowRequestsHistory.map((req, i) => (
                          <tr key={i} className="hover:bg-background-primary/30">
                            <td className="py-2 px-3">
                              <Badge tone={req.method === 'GET' ? 'blue' : 'yellow'}>
                                {req.method}
                              </Badge>
                            </td>
                            <td
                              className="py-2 px-3 font-mono text-[10px] truncate max-w-[200px]"
                              title={req.url}
                            >
                              {req.url}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-status-warning font-semibold">
                              {req.duration}ms
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Database slow query logger */}
            <div className="bg-surface-card border border-border-default rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider flex items-center gap-2">
                <Database size={16} className="text-status-warning" />
                Recent Slow Database Queries
              </h3>
              <div className="border border-border-default rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-background-secondary text-text-secondary font-semibold border-b border-border-default">
                      <tr>
                        <th className="py-2 px-3">Model</th>
                        <th className="py-2 px-3">Action</th>
                        <th className="py-2 px-3 text-right">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default/40">
                      {metrics.databaseMetrics.slowQueriesHistory.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-text-muted">
                            No slow database queries logged. Status optimal.
                          </td>
                        </tr>
                      ) : (
                        metrics.databaseMetrics.slowQueriesHistory.map((query, i) => (
                          <tr key={i} className="hover:bg-background-primary/30">
                            <td className="py-2 px-3 font-semibold text-text-primary">
                              {query.model}
                            </td>
                            <td className="py-2 px-3 font-mono text-[10px] text-text-secondary">
                              {query.action}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-status-warning font-semibold">
                              {query.duration}ms
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Uncaught Frontend Telemetry log */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider flex items-center gap-2 text-status-error">
              <AlertOctagon size={16} />
              Client Crash and Script Load Failure Logs
            </h3>
            <div className="border border-border-default rounded-lg overflow-hidden">
              <div className="overflow-x-auto animate-fade-in">
                <table className="w-full text-xs text-left">
                  <thead className="bg-background-secondary text-text-secondary font-semibold border-b border-border-default">
                    <tr>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Crash Message</th>
                      <th className="py-2 px-3">Trace URL</th>
                      <th className="py-2 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default/40">
                    {metrics.frontendErrors.history.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-text-muted">
                          No client runtime exceptions reported. UI status healthy.
                        </td>
                      </tr>
                    ) : (
                      metrics.frontendErrors.history.map((err, i) => (
                        <tr key={i} className="hover:bg-background-primary/30 text-text-secondary">
                          <td className="py-2.5 px-3">
                            <Badge tone={err.type === 'RENDER_CRASH' ? 'red' : 'gray'}>
                              {err.type}
                            </Badge>
                          </td>
                          <td
                            className="py-2.5 px-3 font-medium text-text-primary max-w-xs truncate"
                            title={err.message}
                          >
                            {err.message}
                          </td>
                          <td
                            className="py-2.5 px-3 font-mono text-[10px] truncate max-w-[200px]"
                            title={err.url}
                          >
                            {err.url}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[10px] text-text-muted">
                            {new Date(err.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
