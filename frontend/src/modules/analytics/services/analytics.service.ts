/**
 * Phase 15B - Analytics API Service
 * Consumes the endpoints created in Phase 15A.
 */

import { apiClient } from '../../../lib/axios';
import type {
  IExecutiveSummary,
  IWorkflowAnalytics,
  IDepartmentAnalytics,
  ICostAnalytics,
  IProductAnalytics,
  IVendorAnalytics,
  IAnalyticsFilters,
} from '../types/analytics.types';

const unwrap = <T>(response: { data: T | { data?: T } }): T => {
  const payload = response.data;
  return typeof payload === 'object' && payload !== null && 'data' in payload
    ? (payload.data as T)
    : (payload as T);
};

export const analyticsService = {
  getSummary: async (): Promise<IExecutiveSummary> => {
    const response = await apiClient.get<IExecutiveSummary>('/analytics/summary');
    return unwrap(response);
  },

  getWorkflow: async (): Promise<IWorkflowAnalytics> => {
    const response = await apiClient.get<IWorkflowAnalytics>('/analytics/workflow');
    return unwrap(response);
  },

  getDepartments: async (): Promise<IDepartmentAnalytics> => {
    const response = await apiClient.get<IDepartmentAnalytics>('/analytics/departments');
    return unwrap(response);
  },

  getCosts: async (filters?: IAnalyticsFilters): Promise<ICostAnalytics> => {
    const params: Record<string, string> = {};
    if (filters?.dateFrom) params.from = new Date(filters.dateFrom).toISOString();
    if (filters?.dateTo) params.to = new Date(filters.dateTo).toISOString();
    const response = await apiClient.get<ICostAnalytics>('/analytics/costs', { params });
    return unwrap(response);
  },

  getProducts: async (filters?: IAnalyticsFilters): Promise<IProductAnalytics> => {
    const params: Record<string, any> = {};
    if (filters?.limit) params.limit = filters.limit;
    const response = await apiClient.get<IProductAnalytics>('/analytics/products', { params });
    return unwrap(response);
  },

  getVendors: async (filters?: IAnalyticsFilters): Promise<IVendorAnalytics> => {
    const params: Record<string, any> = {};
    if (filters?.limit) params.limit = filters.limit;
    const response = await apiClient.get<IVendorAnalytics>('/analytics/vendors', { params });
    return unwrap(response);
  },
};
