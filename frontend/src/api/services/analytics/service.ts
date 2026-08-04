import { BaseService } from '../base.service';
import type {
  AnalyticsSummary,
  WorkflowAnalytics,
  DepartmentAnalytics,
  CostAnalytics,
  ProductAnalytics,
  VendorAnalytics,
  CostAnalyticsQuery,
  ProductAnalyticsQuery,
  VendorAnalyticsQuery,
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

  async getDepartments(): Promise<DepartmentAnalytics[]> {
    return this.get<DepartmentAnalytics[]>('/analytics/departments');
  }

  async getCosts(params?: CostAnalyticsQuery): Promise<CostAnalytics> {
    return this.get<CostAnalytics>('/analytics/costs', params as ListQueryParams | undefined);
  }

  async getProducts(params?: ProductAnalyticsQuery): Promise<ProductAnalytics[]> {
    return this.get<ProductAnalytics[]>(
      '/analytics/products',
      params as ListQueryParams | undefined,
    );
  }

  async getVendors(params?: VendorAnalyticsQuery): Promise<VendorAnalytics[]> {
    return this.get<VendorAnalytics[]>('/analytics/vendors', params as ListQueryParams | undefined);
  }
}

export const analyticsService = new AnalyticsService();
