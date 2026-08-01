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

export const analyticsService = {
  getSummary: async (): Promise<IExecutiveSummary> => {
    const response = await apiClient.get<IExecutiveSummary>('/analytics/summary');
    return response.data;
  },

  getWorkflow: async (): Promise<IWorkflowAnalytics> => {
    const response = await apiClient.get<IWorkflowAnalytics>('/analytics/workflow');
    return response.data;
  },

  getDepartments: async (): Promise<IDepartmentAnalytics> => {
    const response = await apiClient.get<IDepartmentAnalytics>('/analytics/departments');
    return response.data;
  },

  getCosts: async (filters?: IAnalyticsFilters): Promise<ICostAnalytics> => {
    const params: Record<string, string> = {};
    if (filters?.dateFrom) params.from = new Date(filters.dateFrom).toISOString();
    if (filters?.dateTo) params.to = new Date(filters.dateTo).toISOString();
    const response = await apiClient.get<ICostAnalytics>('/analytics/costs', { params });
    return response.data;
  },

  getProducts: async (filters?: IAnalyticsFilters): Promise<IProductAnalytics> => {
    const params: Record<string, any> = {};
    if (filters?.limit) params.limit = filters.limit;
    const response = await apiClient.get<IProductAnalytics>('/analytics/products', { params });
    return response.data;
  },

  getVendors: async (filters?: IAnalyticsFilters): Promise<IVendorAnalytics> => {
    const params: Record<string, any> = {};
    if (filters?.limit) params.limit = filters.limit;
    const response = await apiClient.get<IVendorAnalytics>('/analytics/vendors', { params });
    return response.data;
  },
};
