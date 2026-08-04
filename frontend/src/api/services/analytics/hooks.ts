import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { analyticsService } from './service';
import type {
  CostAnalyticsQuery,
  ProductAnalyticsQuery,
  VendorAnalyticsQuery,
} from '../../types/analytics';

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: queryKeys.analytics.detail('analytics', 'summary'),
    queryFn: () => analyticsService.getSummary(),
    staleTime: 60 * 1000,
  });
}

export function useWorkflowAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics.detail('analytics', 'workflow'),
    queryFn: () => analyticsService.getWorkflow(),
    staleTime: 60 * 1000,
  });
}

export function useDepartmentAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics.detail('analytics', 'departments'),
    queryFn: () => analyticsService.getDepartments(),
    staleTime: 60 * 1000,
  });
}

export function useCostAnalytics(params?: CostAnalyticsQuery) {
  return useQuery({
    queryKey: [...queryKeys.analytics.detail('analytics', 'costs'), params],
    queryFn: () => analyticsService.getCosts(params),
    staleTime: 60 * 1000,
  });
}

export function useProductAnalytics(params?: ProductAnalyticsQuery) {
  return useQuery({
    queryKey: [...queryKeys.analytics.detail('analytics', 'products'), params],
    queryFn: () => analyticsService.getProducts(params),
    staleTime: 60 * 1000,
  });
}

export function useVendorAnalytics(params?: VendorAnalyticsQuery) {
  return useQuery({
    queryKey: [...queryKeys.analytics.detail('analytics', 'vendors'), params],
    queryFn: () => analyticsService.getVendors(params),
    staleTime: 60 * 1000,
  });
}
