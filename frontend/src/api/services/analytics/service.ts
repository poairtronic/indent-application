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
import type { ListQueryParams } from '../../types/query-params';

class AnalyticsService extends BaseService {
  constructor() {
    super({ basePath: '/analytics' });
  }

  async getSummary(): Promise<AnalyticsSummary> {
    return this.get<AnalyticsSummary>('/analytics/summary');
  }

  async getWorkflow(): Promise<WorkflowAnalytics> {
    return this.get<WorkflowAnalytics>('/analytics/workflow');
  }

  async getDepartments(): Promise<DepartmentAnalytics> {
    return this.get<DepartmentAnalytics>('/analytics/departments');
  }

  async getCosts(params?: any): Promise<CostAnalytics> {
    const query: Record<string, string> = {};
    if (params?.from) query.from = params.from;
    else if (params?.dateFrom) query.from = new Date(params.dateFrom).toISOString();
    if (params?.to) query.to = params.to;
    else if (params?.dateTo) query.to = new Date(params.dateTo).toISOString();
    return this.get<CostAnalytics>('/analytics/costs', query as ListQueryParams | undefined);
  }

  async getProducts(params?: any): Promise<ProductAnalytics> {
    return this.get<ProductAnalytics>('/analytics/products', params as ListQueryParams | undefined);
  }

  async getVendors(params?: any): Promise<VendorAnalytics> {
    return this.get<VendorAnalytics>('/analytics/vendors', params as ListQueryParams | undefined);
  }

  async getKpis(params?: any): Promise<KpiData[]> {
    return this.get<KpiData[]>('/analytics/kpis', params as ListQueryParams | undefined);
  }

  async getInsights(params?: any): Promise<any> {
    return this.get<any>('/analytics/insights', params as ListQueryParams | undefined);
  }
}

export const analyticsService = new AnalyticsService();
