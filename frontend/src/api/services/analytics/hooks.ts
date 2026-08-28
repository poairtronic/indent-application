import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { analyticsService } from './service';

export function useAnalyticsSummary(enabled?: boolean) {
  return useQuery({
    queryKey: queryKeys.analytics.detail('analytics', 'summary'),
    queryFn: () => analyticsService.getSummary(),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useWorkflowAnalytics(enabled?: boolean) {
  return useQuery({
    queryKey: queryKeys.analytics.detail('analytics', 'workflow'),
    queryFn: () => analyticsService.getWorkflow(),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useDepartmentAnalytics(enabled?: boolean) {
  return useQuery({
    queryKey: queryKeys.analytics.detail('analytics', 'departments'),
    queryFn: () => analyticsService.getDepartments(),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useCostAnalytics(params?: any, enabled?: boolean) {
  return useQuery({
    queryKey: [...queryKeys.analytics.detail('analytics', 'costs'), params],
    queryFn: () => analyticsService.getCosts(params),
    staleTime: 2 * 60 * 1000,
    enabled: enabled !== undefined ? enabled : true,
  });
}

export function useProductAnalytics(params?: any, enabled?: boolean) {
  return useQuery({
    queryKey: [...queryKeys.analytics.detail('analytics', 'products'), params],
    queryFn: () => analyticsService.getProducts(params),
    staleTime: 5 * 60 * 1000,
    enabled: enabled !== undefined ? enabled : true,
  });
}

export function useVendorAnalytics(params?: any, enabled?: boolean) {
  return useQuery({
    queryKey: [...queryKeys.analytics.detail('analytics', 'vendors'), params],
    queryFn: () => analyticsService.getVendors(params),
    staleTime: 5 * 60 * 1000,
    enabled: enabled !== undefined ? enabled : true,
  });
}

export function useKpis(params?: any, enabled?: boolean) {
  return useQuery({
    queryKey: ['analytics', 'kpis', params],
    queryFn: () => analyticsService.getKpis(params),
    staleTime: 60 * 1000,
    enabled: enabled !== undefined ? enabled : true,
  });
}

export function useInsights(params?: any, enabled?: boolean) {
  return useQuery({
    queryKey: ['analytics', 'insights', params],
    queryFn: () => analyticsService.getInsights(params),
    staleTime: 2 * 60 * 1000,
    enabled: enabled !== undefined ? enabled : true,
  });
}

export function useDashboardOverview(enabled?: boolean) {
  return useQuery({
    queryKey: ['analytics', 'dashboard-overview'],
    queryFn: () => analyticsService.getDashboardOverview(),
    staleTime: 60 * 1000,
    enabled: enabled !== undefined ? enabled : true,
  });
}

export function useVendorProcessAllocations(params?: any, enabled?: boolean) {
  return useQuery({
    queryKey: ['analytics', 'vendors', 'process-allocations', params],
    queryFn: () => analyticsService.getVendorProcessAllocations(params),
    staleTime: 60 * 1000,
    enabled: enabled !== undefined ? enabled : true,
  });
}
