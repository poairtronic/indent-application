import React from 'react';
import { useIndents } from '../../hooks/useIndents';
import { useIndentStore } from '../../store/useIndentStore';
import { CostSheetList } from './components/CostSheetList';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Filter, Grid, List as ListIcon, TrendingUp } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { IndentStatus } from '../../types/indent';

export const CostSheetDashboardPage: React.FC = () => {
  const { filters, setFilters, viewMode, setViewMode } = useIndentStore();
  const { data, isLoading, refetch } = useIndents(filters);

  // The Accounts department mainly focuses on items in ACCOUNTS_COST_VERIFICATION or FINISHED
  // but they can see all for tracking

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
      </div>

      <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-text-muted" size={16} />
            <Input
              placeholder="Search cost sheets..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-64">
            <Select
              options={[
                { label: 'All Statuses', value: '' },
                {
                  label: 'Cost Verification Pending',
                  value: IndentStatus.ACCOUNTS_COST_VERIFICATION,
                },
                {
                  label: 'Financial Closure Pending',
                  value: IndentStatus.ACCOUNTS_FINANCIAL_CLOSURE,
                },
                { label: 'Completed', value: IndentStatus.COMPLETED },
              ]}
              value={filters.status || ''}
              onChange={(e) => setFilters({ status: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <Filter size={14} />
            Refresh
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
        indents={data?.data || []}
        isLoading={isLoading}
        onRefresh={refetch}
        pagination={{
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: data?.total || 0,
        }}
        onPageChange={(page) => setFilters({ page })}
        viewMode={viewMode}
      />
    </div>
  );
};
