import React, { useCallback, useState } from 'react';
import { useIndents } from '../../api/services/indents/hooks';
import { useDepartmentOptions } from '../../api/services/departments/hooks';
import { IndentList } from '../indent/components/IndentList';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Filter, Grid, List as ListIcon } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { WorkflowState } from '../../api/types/enums';

// Store state for production filters locally for simplicity
export const ProductionDashboardPage: React.FC = () => {
  const [filters, setFilters] = useState<{
    page: number;
    limit: number;
    search?: string;
    status?: string;
    departmentId?: string;
  }>({
    page: 1,
    limit: 50,
    status: '',
  });

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, status: value, page: 1 }));
  }, []);

  const handleDepartmentChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, departmentId: value, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const items = data?.items ?? (data as any)?.data ?? [];
  const total = data?.total ?? (data as any)?.meta?.total ?? 0;
  const totalPages = data?.totalPages ?? (data as any)?.meta?.totalPages ?? 1;

  // Filter local items to only show production relevant ones if no explicit status filter is set
  const productionStatuses = [
    'STORES_PROCESSING',
    'MATERIALS_ISSUED',
    'PRODUCTION_PROCESSING',
    'PRODUCTION_COMPLETED',
    'CUSTOMER_DELIVERED',
  ];

  const displayItems = filters.status
    ? items
    : items.filter((item: any) => productionStatuses.includes(item.currentState));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Manufacturing Production</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage manufacturing execution and track work center progress
          </p>
        </div>
      </div>

      <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-text-muted" size={16} />
            <Input
              placeholder="Search manufacturing queue..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={[
                { label: 'All Production Stages', value: '' },
                { label: 'Materials Issued', value: 'MATERIALS_ISSUED' },
                { label: 'Production Processing', value: 'PRODUCTION_PROCESSING' },
                { label: 'Production Completed', value: 'PRODUCTION_COMPLETED' },
                { label: 'Customer Delivered', value: 'CUSTOMER_DELIVERED' },
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
        indents={displayItems}
        isLoading={isLoading}
        onRefresh={refetch}
        pagination={{
          page: filters.page,
          limit: filters.limit,
          total: filters.status ? total : displayItems.length,
          totalPages: filters.status ? totalPages : 1,
        }}
        onPageChange={handlePageChange}
        viewMode={viewMode}
      />
    </div>
  );
};
