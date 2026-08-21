import React, { useState, useCallback } from 'react';
import {
  useCommunicationLogs,
  useCommunicationHealth,
  useCommunicationQueue,
  useCommunicationMetrics,
} from '../../api/services/communication/hooks';
import { Table, type Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  Mail,
  Filter,
  RefreshCw,
  Activity,
  Database,
  Clock,
  CheckCircle2,
  Wifi,
} from 'lucide-react';
import type { CommunicationLog } from '../../api/types/notification';

const STATUS_BADGE: Record<string, 'green' | 'red' | 'yellow' | 'blue' | 'gray'> = {
  SENT: 'green',
  FAILED: 'red',
  PENDING: 'yellow',
  QUEUED: 'blue',
};

const formatTimestamp = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const CommunicationPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const queryParams = {
    page,
    limit: 25,
    status: (statusFilter || undefined) as 'SENT' | 'FAILED' | 'PENDING' | undefined,
  };

  const {
    data: logsData,
    isLoading: isLogsLoading,
    error: logsError,
    refetch: refetchLogs,
    isFetching: isLogsFetching,
  } = useCommunicationLogs(queryParams);
  const {
    data: health,
    isLoading: isHealthLoading,
    refetch: refetchHealth,
  } = useCommunicationHealth();
  const { data: queue, isLoading: isQueueLoading, refetch: refetchQueue } = useCommunicationQueue();
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
  } = useCommunicationMetrics();

  const handleRefreshAll = useCallback(() => {
    refetchLogs();
    refetchHealth();
    refetchQueue();
    refetchMetrics();
  }, [refetchLogs, refetchHealth, refetchQueue, refetchMetrics]);

  const logs = logsData?.items ?? [];
  const total = logsData?.total ?? 0;
  const totalPages = logsData?.totalPages ?? 1;

  const columns: Column<CommunicationLog>[] = [
    {
      key: 'sentAt',
      header: 'Sent At',
      render: (row) => (
        <span className="text-xs text-text-secondary flex items-center gap-1.5 whitespace-nowrap">
          <Clock size={12} className="text-text-muted shrink-0" />
          {formatTimestamp(row.sentAt)}
        </span>
      ),
    },
    {
      key: 'to',
      header: 'Recipient',
      render: (row) => (
        <span
          className="text-xs font-medium text-text-primary truncate max-w-[160px] sm:max-w-[220px] block"
          title={row.to}
        >
          {row.to}
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => (
        <span
          className="text-xs text-text-secondary truncate max-w-[180px] sm:max-w-[260px] block"
          title={row.subject}
        >
          {row.subject}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={STATUS_BADGE[row.status] ?? 'gray'}>{row.status}</Badge>,
    },
    {
      key: 'retryCount',
      header: 'Retries',
      render: (row) => (
        <span className="text-xs font-mono text-text-muted">{row.retryCount ?? 0}</span>
      ),
    },
    {
      key: 'errorMessage',
      header: 'Error',
      render: (row) => (
        <span
          className="text-xs text-status-error truncate max-w-[120px] sm:max-w-[180px] block"
          title={row.errorMessage || ''}
        >
          {row.errorMessage || '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in w-full min-w-0">
      {/* Box 1: Monitoring Header & Health KPI Cards */}
      <div className="bg-surface-card/70 border border-border-default rounded-xl p-4 sm:p-5 shadow-card w-full min-w-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-default/50">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary flex items-center gap-2">
              <Mail className="text-accent-primary shrink-0" size={20} />
              <span>Communication & Email Monitoring</span>
            </h2>
            <p className="text-text-secondary text-xs sm:text-sm mt-0.5">
              Email delivery logs, queue status, and SMTP health monitoring.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            <RefreshCw size={14} />
            <span>Refresh All</span>
          </Button>
        </div>

        {/* Health & Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3.5 w-full min-w-0">
          <div className="bg-background-secondary/70 border border-border-default rounded-lg p-3.5 shadow-sm transition-colors hover:border-accent-primary/40">
            <div className="flex items-center gap-2 mb-2">
              <Wifi
                size={14}
                className={health?.status === 'UP' ? 'text-status-success' : 'text-status-warning'}
              />
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                System Health
              </span>
            </div>
            {isHealthLoading ? (
              <div className="h-6 bg-background-primary/80 rounded animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-lg font-bold ${health?.status === 'UP' ? 'text-status-success' : 'text-status-warning'}`}
                >
                  {health?.status || 'UNKNOWN'}
                </span>
                <span className="text-[10px] text-text-muted">Redis: {health?.redis || '-'}</span>
              </div>
            )}
          </div>

          <div className="bg-background-secondary/70 border border-border-default rounded-lg p-3.5 shadow-sm transition-colors hover:border-accent-primary/40">
            <div className="flex items-center gap-2 mb-2">
              <Database size={14} className="text-info" />
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Queue Status
              </span>
            </div>
            {isQueueLoading ? (
              <div className="h-6 bg-background-primary/80 rounded animate-pulse" />
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">Active:</span>
                  <span className="font-bold text-text-primary">{queue?.mailQueue?.active ?? 0}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">Waiting:</span>
                  <span className="font-bold text-text-primary">
                    {queue?.mailQueue?.waiting ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">Failed:</span>
                  <span className="font-bold text-status-error">{queue?.mailQueue?.failed ?? 0}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">Dead Letter:</span>
                  <span className="font-bold text-status-warning">
                    {queue?.deadQueue?.total ?? 0}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-background-secondary/70 border border-border-default rounded-lg p-3.5 shadow-sm transition-colors hover:border-accent-primary/40">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-accent-primary" />
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Throughput
              </span>
            </div>
            {isMetricsLoading ? (
              <div className="h-6 bg-background-primary/80 rounded animate-pulse" />
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">Processed:</span>
                  <span className="font-bold text-text-primary">
                    {metrics?.throughput?.totalProcessed ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">Completed:</span>
                  <span className="font-bold text-status-success">
                    {metrics?.throughput?.completed ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">Failed:</span>
                  <span className="font-bold text-status-error">
                    {metrics?.throughput?.failed ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">Success Rate:</span>
                  <span className="font-bold text-status-success">
                    {metrics?.throughput?.successRatePercentage ?? 100}%
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-background-secondary/70 border border-border-default rounded-lg p-3.5 shadow-sm transition-colors hover:border-accent-primary/40">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={14} className="text-status-success" />
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Total Emails
              </span>
            </div>
            {isLogsLoading ? (
              <div className="h-6 bg-background-primary/80 rounded animate-pulse" />
            ) : (
              <div>
                <span className="text-2xl font-bold text-text-primary">{total}</span>
                <span className="text-xs text-text-muted ml-2">logged</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Box 2: Email Logs Filter & Data Table */}
      <div className="bg-surface-card/70 border border-border-default rounded-xl p-4 sm:p-5 shadow-card w-full min-w-0 flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-56">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 rounded-lg border border-border-default bg-background-secondary text-text-primary text-xs font-medium focus:ring-1 focus:ring-accent-primary outline-none transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
              <option value="QUEUED">Queued</option>
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchLogs()}
            disabled={isLogsFetching}
            className="flex items-center justify-center gap-2 self-stretch sm:self-auto shrink-0"
          >
            <Filter size={13} />
            <span>{isLogsFetching ? 'Refreshing...' : 'Filter'}</span>
          </Button>
        </div>

        {isLogsLoading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : logsError ? (
          <ErrorState
            title="Failed to Load Email Logs"
            message="Could not retrieve email delivery logs from the backend service."
            onRetry={() => refetchLogs()}
          />
        ) : (
          <div className="w-full min-w-0 overflow-x-auto rounded-lg border border-border-default bg-background-primary/30">
            <Table
              data={logs}
              columns={columns}
              emptyMessage="No email logs found."
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}

        {total > 25 && (
          <div className="pt-2">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={25}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
