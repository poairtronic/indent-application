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
        <span className="text-xs text-text-secondary flex items-center gap-1 whitespace-nowrap">
          <Clock size={10} className="text-text-muted" />
          {formatTimestamp(row.sentAt)}
        </span>
      ),
    },
    {
      key: 'to',
      header: 'Recipient',
      render: (row) => <span className="text-xs text-text-primary">{row.to}</span>,
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => (
        <span
          className="text-xs text-text-secondary truncate max-w-[200px] block"
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
        <span className="text-[10px] font-mono text-text-muted">{row.retryCount ?? 0}</span>
      ),
    },
    {
      key: 'errorMessage',
      header: 'Error',
      render: (row) => (
        <span
          className="text-[10px] text-status-error truncate max-w-[150px] block"
          title={row.errorMessage || ''}
        >
          {row.errorMessage || '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Mail className="text-accent-primary" size={20} />
            Communication & Email Monitoring
          </h2>
          <p className="text-text-secondary text-sm">
            Email delivery logs, queue status, and SMTP health monitoring.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
          className="flex items-center gap-2"
        >
          <RefreshCw size={14} />
          Refresh All
        </Button>
      </div>

      {/* Health & Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-border-default rounded-xl p-4 shadow-card">
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
            <div className="h-6 bg-background-secondary rounded animate-pulse" />
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

        <div className="bg-surface-card border border-border-default rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} className="text-info" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Queue Status
            </span>
          </div>
          {isQueueLoading ? (
            <div className="h-6 bg-background-secondary rounded animate-pulse" />
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Active:</span>
                <span className="font-bold text-text-primary">{queue?.mailQueue?.active ?? 0}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Waiting:</span>
                <span className="font-bold text-text-primary">
                  {queue?.mailQueue?.waiting ?? 0}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Failed:</span>
                <span className="font-bold text-status-error">{queue?.mailQueue?.failed ?? 0}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Dead Letter:</span>
                <span className="font-bold text-status-warning">
                  {queue?.deadQueue?.total ?? 0}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-surface-card border border-border-default rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-accent-primary" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Throughput
            </span>
          </div>
          {isMetricsLoading ? (
            <div className="h-6 bg-background-secondary rounded animate-pulse" />
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Processed:</span>
                <span className="font-bold text-text-primary">
                  {metrics?.throughput?.totalProcessed ?? 0}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Completed:</span>
                <span className="font-bold text-status-success">
                  {metrics?.throughput?.completed ?? 0}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Failed:</span>
                <span className="font-bold text-status-error">
                  {metrics?.throughput?.failed ?? 0}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Success Rate:</span>
                <span className="font-bold text-status-success">
                  {metrics?.throughput?.successRatePercentage ?? 100}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-surface-card border border-border-default rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={14} className="text-status-success" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Total Emails
            </span>
          </div>
          {isLogsLoading ? (
            <div className="h-6 bg-background-secondary rounded animate-pulse" />
          ) : (
            <div>
              <span className="text-lg font-bold text-text-primary">{total}</span>
              <span className="text-[10px] text-text-muted ml-2">logged</span>
            </div>
          )}
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="bg-surface-card border border-border-default rounded-xl p-4 flex-1 flex flex-col">
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-lg border border-border-default bg-surface-card text-text-primary text-sm"
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
            className="flex items-center gap-2"
          >
            <Filter size={14} />
            {isLogsFetching ? 'Refreshing...' : 'Refresh'}
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
          <div className="flex-1 overflow-auto rounded-lg border border-border-default">
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
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={25}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
};
