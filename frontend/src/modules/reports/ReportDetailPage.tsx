import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useAuthStore } from '../../store/authStore';
import { REPORTS_REGISTRY } from './registry';
import {
  useDailyProductionReport,
  useProcessYieldReport,
  useMachineUtilizationReport,
  useActualVsPredictedCostReport,
  useMaterialCostBreakdownReport,
  useDepartmentBudgetReport,
  useVendorPerformanceReport,
  useProductCatalogReport,
  useWorkflowBottleneckReport,
} from '../../api/services/reports/hooks';

// Master data hooks for dropdowns
import { useProducts } from '../../api/services/products/hooks';
import { useDepartments } from '../../api/services/departments/hooks';
import { useVendors } from '../../api/services/vendors/hooks';

export const ReportDetailPage: React.FC = () => {
  const { reportId } = useParams<{ category: string; reportId: string }>();
  const navigate = useNavigate();

  // Find configuration in central registry
  const config = useMemo(() => {
    if (!reportId || !REPORTS_REGISTRY[reportId]) return null;
    return REPORTS_REGISTRY[reportId];
  }, [reportId]);

  if (!config) {
    return (
      <div className="p-8">
        <ErrorState
          title="Report Not Found"
          message="The requested report configuration does not exist in the IMCMS central registry."
          onRetry={() => navigate('/reports')}
        />
      </div>
    );
  }

  // Get user info for local access warning checks (frontend-side guard)
  const user = useAuthStore((s) => s.user);
  const userDept = user?.department?.departmentCode;
  const isAdmin = user?.permissions.includes('settings.manage');
  const isManager = userDept === 'SMGR' || userDept === 'GMGR';

  const hasAccess = useMemo(() => {
    if (isAdmin || isManager) return true;
    switch (config.id) {
      case 'daily-production':
      case 'process-yield':
      case 'machine-utilization':
        return userDept === 'PROD';
      case 'actual-vs-predicted':
      case 'material-breakdown':
      case 'department-budget':
        return userDept === 'ACCT';
      case 'vendor-performance':
        return userDept === 'STOR' || userDept === 'ACCT';
      case 'product-catalog':
      case 'workflow-bottleneck':
        return userDept === 'DSGN' || userDept === 'STOR';
      default:
        return false;
    }
  }, [config.id, userDept, isAdmin, isManager]);

  // Parameters State (Derived from URL parameters for bookmarkable URL state synchronization)
  const [searchParams, setSearchParams] = useSearchParams();

  // Local search text input state to ensure immediate UI responsiveness
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  // Derived filters from URL search params
  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || config.sortBy;
  const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const productId = searchParams.get('productId') || '';
  const departmentId = searchParams.get('departmentId') || '';
  const vendorId = searchParams.get('vendorId') || '';
  const statusFilter = searchParams.get('status') || '';
  const processCode = searchParams.get('processCode') || '';

  // Synchronize debounced search to URL
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  useEffect(() => {
    const currentUrlSearch = searchParams.get('search') || '';
    if (debouncedSearch !== currentUrlSearch) {
      updateParam('search', debouncedSearch || undefined, true);
    }
  }, [debouncedSearch]);

  // Synchronize local input state if URL changes (e.g. forward/back buttons)
  useEffect(() => {
    const currentUrlSearch = searchParams.get('search') || '';
    if (searchInput !== currentUrlSearch) {
      setSearchInput(currentUrlSearch);
    }
  }, [searchParams]);

  // Safe helper to update single URL search parameters and reset page to 1
  const updateParam = (key: string, value: string | undefined, resetPage = true) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (resetPage) {
        next.set('page', '1');
      }
      return next;
    });
  };

  const setPage = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  // Fetch dropdown lists
  const { data: productsData } = useProducts({ limit: 100 });
  const { data: departmentsData } = useDepartments(undefined);
  const { data: vendorsData } = useVendors({ limit: 100 });

  // Map data to dropdown options
  const productOptions = useMemo(() => {
    const list =
      productsData?.items?.map((p: any) => ({
        value: p.id,
        label: `${p.productCode} - ${p.productName}`,
      })) || [];
    return [{ value: '', label: 'All Products' }, ...list];
  }, [productsData]);

  const departmentOptions = useMemo(() => {
    const list =
      departmentsData?.items?.map((d: any) => ({ value: d.id, label: d.departmentName })) || [];
    return [{ value: '', label: 'All Departments' }, ...list];
  }, [departmentsData]);

  const vendorOptions = useMemo(() => {
    const list =
      vendorsData?.items?.map((v: any) => ({
        value: v.id,
        label: `${v.vendorCode} - ${v.vendorName}`,
      })) || [];
    return [{ value: '', label: 'All Vendors' }, ...list];
  }, [vendorsData]);

  // Build query params
  const params = useMemo(() => {
    return {
      page,
      limit,
      search: search || undefined,
      sortBy,
      sortOrder,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      productId: productId || undefined,
      departmentId: departmentId || undefined,
      vendorId: vendorId || undefined,
      status: statusFilter || undefined,
      processCode: processCode || undefined,
    };
  }, [
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    dateFrom,
    dateTo,
    productId,
    departmentId,
    vendorId,
    statusFilter,
    processCode,
  ]);

  // Hook mappings
  const dailyQuery = useDailyProductionReport(
    params,
    hasAccess && config.id === 'daily-production',
  );
  const yieldQuery = useProcessYieldReport(params, hasAccess && config.id === 'process-yield');
  const utilQuery = useMachineUtilizationReport(
    params,
    hasAccess && config.id === 'machine-utilization',
  );
  const costQuery = useActualVsPredictedCostReport(
    params,
    hasAccess && config.id === 'actual-vs-predicted',
  );
  const materialQuery = useMaterialCostBreakdownReport(
    params,
    hasAccess && config.id === 'material-breakdown',
  );
  const budgetQuery = useDepartmentBudgetReport(
    params,
    hasAccess && config.id === 'department-budget',
  );
  const vendorQuery = useVendorPerformanceReport(
    params,
    hasAccess && config.id === 'vendor-performance',
  );
  const productQuery = useProductCatalogReport(params, hasAccess && config.id === 'products');
  const workflowQuery = useWorkflowBottleneckReport(
    params,
    hasAccess && config.id === 'workflow-bottleneck',
  );

  // Select current query
  const query = useMemo(() => {
    switch (config.id) {
      case 'daily-production':
        return dailyQuery;
      case 'process-yield':
        return yieldQuery;
      case 'machine-utilization':
        return utilQuery;
      case 'actual-vs-predicted':
        return costQuery;
      case 'material-breakdown':
        return materialQuery;
      case 'department-budget':
        return budgetQuery;
      case 'vendor-performance':
        return vendorQuery;
      case 'products':
        return productQuery;
      case 'workflow-bottleneck':
        return workflowQuery;
      default:
        return {
          data: null,
          isLoading: false,
          isError: true,
          error: new Error('Unknown report ID'),
          refetch: () => Promise.resolve(),
        };
    }
  }, [
    config.id,
    dailyQuery,
    yieldQuery,
    utilQuery,
    costQuery,
    materialQuery,
    budgetQuery,
    vendorQuery,
    productQuery,
    workflowQuery,
  ]);

  if (!hasAccess) {
    return (
      <div className="p-8">
        <ErrorState
          title="Unauthorized Access"
          message="Your department or role does not have permission to view this report category."
          onRetry={() => navigate('/reports')}
        />
      </div>
    );
  }

  // Handle search submit immediately
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput || undefined, true);
  };

  // Handle sorting URL state update
  const handleSort = (columnKey: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const currentSortBy = next.get('sortBy') || config.sortBy;
      const currentSortOrder = next.get('sortOrder') || 'asc';
      if (currentSortBy === columnKey) {
        next.set('sortOrder', currentSortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        next.set('sortBy', columnKey);
        next.set('sortOrder', 'asc');
      }
      next.set('page', '1');
      return next;
    });
  };

  // Convert registry columns to Table.tsx Column interface
  const tableColumns = config.columns.map((col: any, idx: number) => {
    const key = col.sortKey || (typeof col.accessor === 'string' ? col.accessor : `col-${idx}`);
    return {
      key,
      header: col.header,
      sortable: !!(col.sortKey || typeof col.accessor === 'string'),
      render: typeof col.accessor === 'function' ? col.accessor : undefined,
    };
  });

  const handleExportClick = (type: string) => {
    alert(
      `${type} export is under development. Export engines will be implemented in later stages of Phase 23.`,
    );
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="flex flex-col h-full animate-fade-in font-sans pb-12">
      {/* Header and Back Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent-primary mb-2 transition-colors focus:outline-none"
          >
            <ArrowLeft size={14} /> Back to Reports catalog
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-text-primary">{config.name}</h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-accent-primary/10 text-accent-primary rounded border border-accent-primary/20">
              {config.category}
            </span>
          </div>
          <p className="text-text-secondary text-xs mt-1">{config.description}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Printer size={14} />}
            onClick={() => handleExportClick('Print')}
          >
            Print
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Download size={14} />}
            onClick={() => handleExportClick('CSV')}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-surface-card border border-border-default rounded-xl p-5 shadow-card mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            {/* Search Input */}
            <div className="flex gap-1.5 items-end">
              <Input
                label="Search"
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button type="submit" variant="secondary" size="sm" className="h-9 px-3 shrink-0">
                <Search size={14} />
              </Button>
            </div>

            {/* Date Range Filters */}
            {config.filters.some((f) => f.field === 'dateRange') && (
              <>
                <Input
                  label="From Date"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    updateParam('dateFrom', e.target.value || undefined);
                  }}
                />
                <Input
                  label="To Date"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    updateParam('dateTo', e.target.value || undefined);
                  }}
                />
              </>
            )}

            {/* Select Dropdown Filters */}
            {config.filters.map((f) => {
              if (f.type !== 'select') return null;

              let options = f.options || [];
              if (f.field === 'productId') options = productOptions;
              if (f.field === 'departmentId') options = departmentOptions;
              if (f.field === 'vendorId') options = vendorOptions;

              const value =
                f.field === 'productId'
                  ? productId
                  : f.field === 'departmentId'
                    ? departmentId
                    : f.field === 'vendorId'
                      ? vendorId
                      : statusFilter;

              const onChange = (val: string) => {
                const paramKey = f.field === 'status' ? 'status' : f.field;
                updateParam(paramKey, val || undefined);
              };

              return (
                <Select
                  key={f.field}
                  label={f.name}
                  value={value}
                  options={options}
                  onChange={(e) => onChange(e.target.value)}
                />
              );
            })}

            {/* Text Field Filters */}
            {config.filters.map((f) => {
              if (f.type !== 'text') return null;
              const value = f.field === 'processCode' ? processCode : '';
              return (
                <Input
                  key={f.field}
                  label={f.name}
                  placeholder={f.placeholder}
                  value={value}
                  onChange={(e) => {
                    updateParam(f.field, e.target.value || undefined);
                  }}
                />
              );
            })}
          </div>

          <div className="flex justify-between items-center border-t border-border-default pt-4 mt-2">
            <span className="text-[10px] text-text-muted">
              Authoritative values sourced from PostgreSQL Neon Database
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={12} />}
                onClick={() => (query as any).refetch()}
              >
                Reload
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Data Table */}
      {query.isError ? (
        <ErrorState
          title="Failed to Load Report"
          message={
            query.error?.message || 'An error occurred while fetching report data from the backend.'
          }
          onRetry={() => (query as any).refetch()}
        />
      ) : query.data?.isDatabaseGap ? (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-8 text-center max-w-2xl mx-auto my-12 shadow-card">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 mx-auto text-amber-500">
            <AlertTriangle size={28} className="animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-text-primary mb-2">Database Gap Identified</h3>
          <p className="text-xs text-text-muted leading-relaxed mb-6">{query.data.gapMessage}</p>
          <div className="text-left bg-background-secondary border border-border-default rounded-lg p-5 text-xs text-text-secondary leading-relaxed">
            <strong className="block text-xs font-bold text-text-primary mb-2 uppercase tracking-wide">
              Missing Relational Schema Elements
            </strong>
            <p className="mb-2">
              This report requires business objects that are currently not stored in the database.
              To implement this report, the following PostgreSQL tables and relations need to be
              established:
            </p>
            <ul className="list-disc list-inside space-y-1 text-text-muted font-mono text-[10px]">
              {query.data.missingFields?.map((field: string) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : query.data && query.data.data.length === 0 && !query.isLoading ? (
        <EmptyState
          title="No Report Data"
          description="There are no records matching your current filter criteria."
          variant="no-results"
          action={
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <Table
            columns={tableColumns}
            data={(query.data?.data as any[]) || []}
            loading={query.isLoading}
            sortColumn={sortBy}
            sortDirection={sortOrder}
            onSort={handleSort}
            page={page}
            totalPages={query.data?.meta.totalPages || 1}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}
    </div>
  );
};
