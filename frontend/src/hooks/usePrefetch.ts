import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/hooks/query-keys';
import { useAuthStore } from '../store/authStore';

export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchPath = (path: string) => {
    if (path.includes('/dashboard')) {
      import('../pages/DashboardPage').catch(() => {});
      if (useAuthStore.getState().hasPermission('analytics.view')) {
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
    }

    if (path.includes('/indents/create')) {
      // Safe to prefetch master data for "New Indent" using the EXACT same keys the form uses
      if (useAuthStore.getState().hasPermission('materials.view')) {
        import('../api/services/materials/service')
          .then((m) => {
            queryClient.prefetchQuery({
              queryKey: [...queryKeys.materials.list('materials'), { page: 1, limit: 1000 }],
              queryFn: () => m.materialService.list({ page: 1, limit: 1000 }),
              staleTime: 5 * 60 * 1000,
            });
          })
          .catch(() => {});
      }

      if (useAuthStore.getState().hasPermission('products.view')) {
        import('../api/services/products/service')
          .then((m) => {
            queryClient.prefetchQuery({
              queryKey: [...queryKeys.products.list('products'), { page: 1, limit: 1000 }],
              queryFn: () => m.productService.list({ page: 1, limit: 1000 }),
              staleTime: 5 * 60 * 1000,
            });
          })
          .catch(() => {});
      }

      if (useAuthStore.getState().hasPermission('vendors.view')) {
        import('../api/services/vendors/service')
          .then((m) => {
            queryClient.prefetchQuery({
              queryKey: [...queryKeys.vendors.list('vendors'), { page: 1, limit: 1000 }],
              queryFn: () => m.vendorService.list({ page: 1, limit: 1000 }),
              staleTime: 5 * 60 * 1000,
            });
          })
          .catch(() => {});
      }

      if (useAuthStore.getState().hasPermission('units.view')) {
        import('../api/services/units/service')
          .then((m) => {
            queryClient.prefetchQuery({
              queryKey: [...queryKeys.units.list('units'), { page: 1, limit: 1000 }],
              queryFn: () => m.unitService.list({ page: 1, limit: 1000 }),
              staleTime: 5 * 60 * 1000,
            });
          })
          .catch(() => {});
      }

      if (useAuthStore.getState().hasPermission('manufacturing-processes.view')) {
        import('../api/services/processes/service')
          .then((m) => {
            queryClient.prefetchQuery({
              queryKey: [
                ...queryKeys.processes.list('manufacturing-processes'),
                { page: 1, limit: 1000 },
              ],
              queryFn: () => m.processService.list({ page: 1, limit: 1000 }),
              staleTime: 5 * 60 * 1000,
            });
          })
          .catch(() => {});
      }
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
