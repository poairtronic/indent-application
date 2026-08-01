/**
 * Phase 15B - React Query hooks for Analytics
 * Encapsulates data fetching, loading, error, and caching behavior.
 */

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics.service';
import type { IAnalyticsFilters } from '../types/analytics.types';

export const useAnalyticsSummary = () => {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsService.getSummary(),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useWorkflowAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'workflow'],
    queryFn: () => analyticsService.getWorkflow(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useDepartmentAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'departments'],
    queryFn: () => analyticsService.getDepartments(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCostAnalytics = (filters?: IAnalyticsFilters) => {
  return useQuery({
    queryKey: ['analytics', 'costs', filters],
    queryFn: () => analyticsService.getCosts(filters),
    staleTime: 2 * 60 * 1000, // Cost is financial: cache for 2 minutes
    refetchOnWindowFocus: false,
  });
};

export const useProductAnalytics = (filters?: IAnalyticsFilters) => {
  return useQuery({
    queryKey: ['analytics', 'products', filters],
    queryFn: () => analyticsService.getProducts(filters),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useVendorAnalytics = (filters?: IAnalyticsFilters) => {
  return useQuery({
    queryKey: ['analytics', 'vendors', filters],
    queryFn: () => analyticsService.getVendors(filters),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
