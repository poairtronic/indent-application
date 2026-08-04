import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIndents } from '../../hooks/useIndents';
import { useIndentStore } from '../../store/useIndentStore';
import { IndentList } from './components/IndentList';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Plus, Filter, Grid, List as ListIcon } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { IndentStatus } from '../../types/indent';

export const IndentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { filters, setFilters, viewMode, setViewMode } = useIndentStore();
  const { data, isLoading, refetch } = useIndents(filters);

  // Mock departments for filter
  const departments = [
    { id: '1', name: 'Design Dept' },
    { id: '2', name: 'Stores Dept' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Indent Management</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage manufacturing material requirements
          </p>
        </div>
        <Button onClick={() => navigate('/indents/create')} className="flex items-center gap-2">
          <Plus size={16} />
          Create Indent
        </Button>
      </div>

      <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-text-muted" size={16} />
            <Input
              placeholder="Search indents..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={[
                { label: 'All Statuses', value: '' },
                ...Object.values(IndentStatus).map((s) => ({
                  label: s.replace(/_/g, ' '),
                  value: s,
                })),
              ]}
              value={filters.status || ''}
              onChange={(e) => setFilters({ status: e.target.value })}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={[
                { label: 'All Departments', value: '' },
                ...departments.map((d) => ({ label: d.name, value: d.id })),
              ]}
              value={filters.departmentId || ''}
              onChange={(e) => setFilters({ departmentId: e.target.value })}
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

      <IndentList
        indents={data?.data || []}
        isLoading={isLoading}
        onRefresh={refetch}
        pagination={{
          page: filters.page,
          limit: filters.limit,
          total: data?.total || 0,
        }}
        onPageChange={(page) => setFilters({ page })}
        viewMode={viewMode}
      />
    </div>
  );
};
