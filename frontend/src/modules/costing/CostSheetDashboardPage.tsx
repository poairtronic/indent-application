import React, { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from 'react-router-dom';
import { useIndents } from '../../api/services/indents/hooks';
import { useIndentStore } from '../../store/useIndentStore';
import { useAuthStore } from '../../store/authStore';
import { CostSheetList } from './components/CostSheetList';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Filter, Grid, List as ListIcon, TrendingUp, Plus } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { AppPermission } from '../../constants/permissions';
import type { WorkflowState } from '../../api/types/enums';

const COST_RELEVANT_STATES: { label: string; value: string }[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Design Completed', value: 'DESIGN_COMPLETED' },
  { label: 'Stores Processing', value: 'STORES_PROCESSING' },
  { label: 'Cost Verification Pending', value: 'ACCOUNTS_COST_VERIFICATION' },
  { label: 'Actual Cost Updated', value: 'ACTUAL_COST_UPDATED' },
  { label: 'Financial Closure Pending', value: 'ACCOUNTS_FINANCIAL_CLOSURE' },
  { label: 'Completed', value: 'COMPLETED' },
];

export const CostSheetDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { filters, setFilters, viewMode, setViewMode } = useIndentStore(
    useShallow((state) => ({
      filters: state.filters,
      setFilters: state.setFilters,
      viewMode: state.viewMode,
      setViewMode: state.setViewMode,
    })),
  );
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const canView = hasPermission(AppPermission.COSTSHEET_VIEW);
  const canCreate = hasPermission(AppPermission.INDENT_CREATE);

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const search = useDebouncedValue(searchInput, 300);

  const queryParams = {
    page: filters.page,
    limit: filters.limit,
    search: search || undefined,
    state: (filters.status || undefined) as WorkflowState | undefined,
  };

  const { data, isLoading, refetch, isFetching } = useIndents(queryParams);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      setFilters({ page: 1 });
    },
    [setFilters],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      setFilters({ status: value, page: 1 });
    },
    [setFilters],
  );

  const items = data?.items ?? (data as any)?.data ?? [];
  const total = data?.total ?? (data as any)?.meta?.total ?? 0;
  const totalPages = data?.totalPages ?? (data as any)?.meta?.totalPages ?? 1;

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-status-error/10 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h2 className="text-lg font-bold text-text-primary mb-2">Access Denied</h2>
        <p className="text-sm text-text-secondary">
          You don't have permission to view cost sheets.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <TrendingUp className="text-accent-primary" /> Cost Sheet Management
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Track planned vs actual manufacturing costs
          </p>
        </div>
        {canCreate && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/indents/create')}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            New Indent
          </Button>
        )}
      </div>

      <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-text-muted" size={16} />
            <Input
              placeholder="Search cost sheets..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-64">
            <Select
              options={COST_RELEVANT_STATES}
              value={filters.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
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
          <div className="flex bg-background-primary rounded-lg border border-border-default p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-surface-elevated text-accent-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
            >
              <ListIcon size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-surface-elevated text-accent-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
            >
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>

      <CostSheetList
        indents={items}
        isLoading={isLoading}
        onRefresh={refetch}
        pagination={{
          page: filters.page || 1,
          limit: filters.limit || 10,
          total,
          totalPages,
        }}
        onPageChange={(page) => setFilters({ page })}
        viewMode={viewMode}
      />
    </div>
  );
};
