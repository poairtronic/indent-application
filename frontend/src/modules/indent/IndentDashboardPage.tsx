import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIndents } from '../../api/services/indents/hooks';
import { useDepartmentOptions } from '../../api/services/departments/hooks';
import { useIndentStore } from '../../store/useIndentStore';
import { useAuthStore } from '../../store/authStore';
import { AppPermission } from '../../constants/permissions';
import { IndentList } from './components/IndentList';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Plus, Filter, Grid, List as ListIcon } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { WorkflowState } from '../../api/types/enums';

export const IndentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { filters, setFilters, viewMode, setViewMode } = useIndentStore();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const canCreate = hasPermission(AppPermission.INDENT_CREATE);

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const search = useDebouncedValue(searchInput, 300);

  const queryParams = {
    page: filters.page,
    limit: filters.limit,
    search: search || undefined,
    state: (filters.status || undefined) as WorkflowState | undefined,
    departmentId: filters.departmentId || undefined,
  };

  const { data, isLoading, refetch, isFetching } = useIndents(queryParams);
  const { data: departments } = useDepartmentOptions();

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

  const handleDepartmentChange = useCallback(
    (value: string) => {
      setFilters({ departmentId: value, page: 1 });
    },
    [setFilters],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setFilters({ page });
    },
    [setFilters],
  );

  const items = data?.items ?? (data as any)?.data ?? [];
  const total = data?.total ?? (data as any)?.meta?.total ?? 0;
  const totalPages = data?.totalPages ?? (data as any)?.meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Indent Management</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage manufacturing material requirements
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/indents/create')} className="flex items-center gap-2">
            <Plus size={16} />
            Create Indent
          </Button>
        )}
      </div>

      <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-text-muted" size={16} />
            <Input
              placeholder="Search by indent number or purpose..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Design Completed', value: 'DESIGN_COMPLETED' },
                { label: 'Stores Processing', value: 'STORES_PROCESSING' },
                { label: 'Materials Issued', value: 'MATERIALS_ISSUED' },
                { label: 'Production Processing', value: 'PRODUCTION_PROCESSING' },
                { label: 'Production Completed', value: 'PRODUCTION_COMPLETED' },
                { label: 'Customer Delivered', value: 'CUSTOMER_DELIVERED' },
                { label: 'Accounts Verification', value: 'ACCOUNTS_COST_VERIFICATION' },
                { label: 'Actual Cost Updated', value: 'ACTUAL_COST_UPDATED' },
                { label: 'Financial Closure', value: 'ACCOUNTS_FINANCIAL_CLOSURE' },
                { label: 'Archived', value: 'ARCHIVED' },
                { label: 'Completed', value: 'COMPLETED' },
              ]}
              value={filters.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={[
                { label: 'All Departments', value: '' },
                ...(departments ?? []).map((d) => ({ label: d.departmentName, value: d.id })),
              ]}
              value={filters.departmentId || ''}
              onChange={(e) => handleDepartmentChange(e.target.value)}
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

      <IndentList
        indents={items}
        isLoading={isLoading}
        onRefresh={refetch}
        pagination={{
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages,
        }}
        onPageChange={handlePageChange}
        viewMode={viewMode}
      />
    </div>
  );
};
