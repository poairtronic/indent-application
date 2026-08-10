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
  IInsightsSummary,
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

  getKpis: async (params?: Record<string, any>): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/analytics/kpis', { params });
    return unwrap(response);
  },

  getInsights: async (filters?: IAnalyticsFilters): Promise<IInsightsSummary> => {
    const params: Record<string, any> = {};
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.departmentId) params.departmentId = filters.departmentId;
    if (filters?.productId) params.productId = filters.productId;
    if (filters?.vendorId) params.vendorId = filters.vendorId;
    if (filters?.status) params.status = filters.status;
    const response = await apiClient.get<IInsightsSummary>('/analytics/insights', { params });
    return unwrap(response);
  },
};
