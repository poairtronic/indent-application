import { BaseService } from '../base.service';
import type {
  AnalyticsSummary,
  WorkflowAnalytics,
  DepartmentAnalytics,
  CostAnalytics,
  ProductAnalytics,
  VendorAnalytics,
  IVendorProcessAllocation,
  KpiData,
} from '../../types/analytics';

function cleanQueryParams(params?: Record<string, any>): Record<string, any> | undefined {
  if (!params) return undefined;
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      if (
        (key === 'dateFrom' || key === 'dateTo' || key === 'from' || key === 'to') &&
        typeof value === 'string'
      ) {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          cleaned[key] = parsed.toISOString();
        }
      } else {
        cleaned[key] = value;
      }
    }
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

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
    const query = cleanQueryParams(params);
    return this.getRaw<CostAnalytics>('/analytics/costs', query);
  }

  async getProducts(params?: any): Promise<ProductAnalytics> {
    const query = cleanQueryParams(params);
    return this.getRaw<ProductAnalytics>('/analytics/products', query);
  }

  async getVendors(params?: any): Promise<VendorAnalytics> {
    const query = cleanQueryParams(params);
    return this.getRaw<VendorAnalytics>('/analytics/vendors', query);
  }

  async getKpis(params?: any): Promise<KpiData[]> {
    const query = cleanQueryParams(params);
    return this.getRaw<KpiData[]>('/analytics/kpis', query);
  }

  async getInsights(params?: any): Promise<any> {
    const query = cleanQueryParams(params);
    return this.getRaw<any>('/analytics/insights', query);
  }

  async getDashboardOverview(): Promise<{
    summary: AnalyticsSummary;
    workflow: WorkflowAnalytics;
    departments: DepartmentAnalytics;
    costs: CostAnalytics;
    products: ProductAnalytics;
  }> {
    return this.getRaw('/analytics/dashboard-overview');
  }
  async getVendorProcessAllocations(params?: any): Promise<IVendorProcessAllocation[]> {
    const query = cleanQueryParams(params);
    return this.getRaw<IVendorProcessAllocation[]>('/analytics/vendors/process-allocations', query);
  }
}

export const analyticsService = new AnalyticsService();


