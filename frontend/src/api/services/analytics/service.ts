import { BaseService } from '../base.service';
import type {
  AnalyticsSummary,
  WorkflowAnalytics,
  DepartmentAnalytics,
  CostAnalytics,
  ProductAnalytics,
  VendorAnalytics,
  KpiData,
} from '../../types/analytics';

class AnalyticsService extends BaseService {
  constructor() {
    super({ basePath: '/analytics' });
  }

  async getSummary(): Promise<AnalyticsSummary> {
    return this.getRaw<AnalyticsSummary>('/analytics/summary');
  }

  async getWorkflow(): Promise<WorkflowAnalytics> {
    return this.getRaw<WorkflowAnalytics>('/analytics/workflow');
  }

  async getDepartments(): Promise<DepartmentAnalytics> {
    return this.getRaw<DepartmentAnalytics>('/analytics/departments');
  }

  async getCosts(params?: any): Promise<CostAnalytics> {
    const query: Record<string, string> = {};
    if (params?.from) query.from = params.from;
    else if (params?.dateFrom) query.from = new Date(params.dateFrom).toISOString();
    if (params?.to) query.to = params.to;
    else if (params?.dateTo) query.to = new Date(params.dateTo).toISOString();
    return this.getRaw<CostAnalytics>(
      '/analytics/costs',
      Object.keys(query).length > 0 ? query : undefined,
    );
  }

  async getProducts(params?: any): Promise<ProductAnalytics> {
    const query: Record<string, any> = {};
    if (params?.limit) query.limit = params.limit;
    return this.getRaw<ProductAnalytics>(
      '/analytics/products',
      Object.keys(query).length > 0 ? query : undefined,
    );
  }

  async getVendors(params?: any): Promise<VendorAnalytics> {
    const query: Record<string, any> = {};
    if (params?.limit) query.limit = params.limit;
    return this.getRaw<VendorAnalytics>(
      '/analytics/vendors',
      Object.keys(query).length > 0 ? query : undefined,
    );
  }

  async getKpis(params?: any): Promise<KpiData[]> {
    return this.getRaw<KpiData[]>('/analytics/kpis', params);
  }

  async getInsights(params?: any): Promise<any> {
    return this.getRaw<any>('/analytics/insights', params);
  }
}

export const analyticsService = new AnalyticsService();
