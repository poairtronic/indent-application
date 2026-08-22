import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/hooks/query-keys';

export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchPath = (path: string) => {
    if (path.includes('/dashboard')) {
      import('../pages/DashboardPage').catch(() => {});
      import('../api/services/analytics/service')
        .then((m) => {
          queryClient.prefetchQuery({
            queryKey: ['analytics', 'dashboard-overview'],
            queryFn: () => m.analyticsService.getDashboardOverview(),
            staleTime: 60 * 1000,
          });
        })
        .catch(() => {});
    }

    if (path.includes('/indents') && !path.includes('create')) {
      import('../modules/indent/IndentDashboardPage').catch(() => {});
      import('../api/services/indents/service')
        .then((m) => {
          queryClient.prefetchQuery({
            queryKey: [...queryKeys.indents.list('indents'), { page: 1, limit: 10 }],
            queryFn: () => m.indentService.list({ page: 1, limit: 10 }),
            staleTime: 60 * 1000,
          });
        })
        .catch(() => {});

      // Since it's indents, we can safely prefetch master data for "New Indent"
      // Phase 2I - Master Data Prefetch
      import('../api/services/materials/service')
        .then((m) => {
          queryClient.prefetchQuery({
            queryKey: queryKeys.materials.lists(),
            queryFn: () => m.materialService.list({ page: 1, limit: 100 }),
            staleTime: 5 * 60 * 1000,
          });
        })
        .catch(() => {});

      import('../api/services/products/service')
        .then((m) => {
          queryClient.prefetchQuery({
            queryKey: queryKeys.products.lists(),
            queryFn: () => m.productService.list({ page: 1, limit: 100 }),
            staleTime: 5 * 60 * 1000,
          });
        })
        .catch(() => {});

      import('../api/services/departments/service')
        .then((m) => {
          queryClient.prefetchQuery({
            queryKey: queryKeys.departments.lists(),
            queryFn: () => m.departmentService.list({ page: 1, limit: 100 }),
            staleTime: 5 * 60 * 1000,
          });
        })
        .catch(() => {});
    }

    if (path.includes('/workflow')) {
      import('../modules/workflow/WorkflowPage').catch(() => {});
      import('../api/services/indents/service')
        .then((m) => {
          queryClient.prefetchQuery({
            queryKey: [
              ...queryKeys.indents.list('indents'),
              { state: 'DESIGN_COMPLETED,STORES_PROCESSING' },
            ],
            queryFn: () =>
              m.indentService.list({ state: 'DESIGN_COMPLETED,STORES_PROCESSING' as any }),
            staleTime: 60 * 1000,
          });
        })
        .catch(() => {});
    }

    if (path.includes('/production')) {
      import('../modules/production/ProductionDashboardPage').catch(() => {});
      import('../api/services/indents/service')
        .then((m) => {
          queryClient.prefetchQuery({
            queryKey: [...queryKeys.indents.list('indents'), { state: 'PRODUCTION_PROCESSING' }],
            queryFn: () => m.indentService.list({ state: 'PRODUCTION_PROCESSING' as any }),
            staleTime: 60 * 1000,
          });
        })
        .catch(() => {});
    }
  };

  return { prefetchPath };
}
