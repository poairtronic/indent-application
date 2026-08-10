/**
 * Phase 15B - React Query hooks for Analytics
 * Encapsulates data fetching, loading, error, and caching behavior.
 */

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics.service';
import type { IAnalyticsFilters } from '../types/analytics.types';

export const useAnalyticsSummary = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsService.getSummary(),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    refetchOnWindowFocus: false,
    enabled,
  });
};

export const useWorkflowAnalytics = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics', 'workflow'],
    queryFn: () => analyticsService.getWorkflow(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });
};

export const useDepartmentAnalytics = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics', 'departments'],
    queryFn: () => analyticsService.getDepartments(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });
};

export const useCostAnalytics = (filters?: IAnalyticsFilters, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics', 'costs', filters],
    queryFn: () => analyticsService.getCosts(filters),
    staleTime: 2 * 60 * 1000, // Cost is financial: cache for 2 minutes
    refetchOnWindowFocus: false,
    enabled,
  });
};

export const useProductAnalytics = (filters?: IAnalyticsFilters, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics', 'products', filters],
    queryFn: () => analyticsService.getProducts(filters),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });
};

export const useVendorAnalytics = (filters?: IAnalyticsFilters, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics', 'vendors', filters],
    queryFn: () => analyticsService.getVendors(filters),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });
};

export const useKpis = (params?: Record<string, any>, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics', 'kpis', params],
    queryFn: () => analyticsService.getKpis(params),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });
};
