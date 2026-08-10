import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { analyticsService } from './service';
import type {
  CostAnalyticsQuery,
  ProductAnalyticsQuery,
  VendorAnalyticsQuery,
} from '../../types/analytics';

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

export function useCostAnalytics(params?: CostAnalyticsQuery, enabled?: boolean) {
  return useQuery({
    queryKey: [...queryKeys.analytics.detail('analytics', 'costs'), params],
    queryFn: () => analyticsService.getCosts(params),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useProductAnalytics(params?: ProductAnalyticsQuery, enabled?: boolean) {
  return useQuery({
    queryKey: [...queryKeys.analytics.detail('analytics', 'products'), params],
    queryFn: () => analyticsService.getProducts(params),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useVendorAnalytics(params?: VendorAnalyticsQuery, enabled?: boolean) {
  return useQuery({
    queryKey: [...queryKeys.analytics.detail('analytics', 'vendors'), params],
    queryFn: () => analyticsService.getVendors(params),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useKpis(params?: any, enabled?: boolean) {
  return useQuery({
    queryKey: ['analytics', 'kpis', params],
    queryFn: () => analyticsService.getKpis(params),
    staleTime: 60 * 1000,
    enabled,
  });
}
