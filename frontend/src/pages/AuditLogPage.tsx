import React, { useState, useCallback } from 'react';
import { useAuditLogs } from '../api/services/audit/hooks';
import { Table, type Column } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { Shield, Search, Filter, Download, Clock, User } from 'lucide-react';
import type { AuditLogEntry } from '../api/types/audit';
import { useAuthStore } from '../store/authStore';

const ACTION_BADGE: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  ARCHIVE: 'gray',
  SUBMIT: 'green',
  ISSUE: 'green',
  VERIFY: 'blue',
  COMPLETE: 'green',
  DELIVER: 'green',
  LOGIN: 'blue',
  LOGOUT: 'gray',
  FAILED: 'red',
};

const formatTimestamp = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const AuditLogPage: React.FC = () => {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canExport = hasPermission('reports.export');
  const [searchInput, setSearchInput] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const search = useDebouncedValue(searchInput, 300);

  const queryParams = {
    page,
    limit: 25,
    search: search || undefined,
    module: moduleFilter || undefined,
    sortBy: sortColumn,
    sortOrder: sortDirection,
  };

  const { data, isLoading, error, refetch, isFetching } = useAuditLogs(queryParams);

  const handleSort = useCallback(
    (column: string) => {
      if (sortColumn === column) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortColumn(column);
        setSortDirection('desc');
      }
      setPage(1);
    },
    [sortColumn],
  );

  const logs = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-text-secondary flex items-center gap-1 whitespace-nowrap">
          <Clock size={10} className="text-text-muted" />
          {formatTimestamp(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (row) => (
        <span className="text-xs text-text-primary flex items-center gap-1">
          <User size={10} className="text-text-muted" />
          {row.user ? `${row.user.firstName} ${row.user.lastName}` : 'SYSTEM'}
          {row.user?.employeeCode && (
            <span className="text-[10px] text-text-muted">({row.user.employeeCode})</span>
          )}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (row) => {
        const badgeTone =
          Object.entries(ACTION_BADGE).find(([key]) =>
            row.action.toUpperCase().includes(key),
          )?.[1] ?? 'gray';
        return <Badge tone={badgeTone}>{row.action.replace(/_/g, ' ')}</Badge>;
      },
    },
    {
      key: 'module',
      header: 'Module',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-mono text-text-secondary bg-background-secondary px-1.5 py-0.5 rounded">
          {row.module}
        </span>
      ),
    },
    {
      key: 'recordId',
      header: 'Record',
      render: (row) => (
        <span
          className="text-[10px] font-mono text-text-muted truncate max-w-[120px] block"
          title={row.recordId}
        >
          {row.recordId ? row.recordId.substring(0, 8) + '...' : '-'}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (row) => (
        <span className="text-[10px] font-mono text-text-muted">{row.ipAddress || '-'}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Shield className="text-accent-primary" size={20} />
            Audit Logs
          </h2>
          <p className="text-text-secondary text-sm">
            Comprehensive system event tracking for compliance and security.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && (
            <span className="text-[10px] text-accent-primary animate-pulse">Refreshing...</span>
          )}
          <Button variant="outline" icon={<Download size={16} />} disabled={!canExport}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-surface-card border border-border-default rounded-xl p-4 flex-1 flex flex-col">
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 text-text-muted" size={16} />
            <Input
              placeholder="Search audit logs..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-lg border border-border-default bg-surface-card text-text-primary text-sm"
            >
              <option value="">All Modules</option>
              <option value="BUSINESS_TRANSACTION">Business Transaction</option>
              <option value="STORES">Stores</option>
              <option value="PRODUCTION">Production</option>
              <option value="ACCOUNTS">Accounts</option>
              <option value="SYSTEM">System</option>
              <option value="AUTH">Auth</option>
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <Filter size={14} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : error ? (
          <ErrorState
            title="Failed to Load Audit Logs"
            message="Could not retrieve audit trail data from the backend service."
            onRetry={() => refetch()}
          />
        ) : (
          <div className="flex-1 overflow-auto rounded-lg border border-border-default">
            <Table
              data={logs}
              columns={columns}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              emptyMessage="No audit logs found matching your criteria."
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}

        {!isLoading && !error && (
          <div className="mt-4 flex justify-between items-center text-xs text-text-secondary">
            <span>
              Showing {logs.length} of {total} events
            </span>
            <span>Data retained for 90 days as per enterprise policy</span>
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
