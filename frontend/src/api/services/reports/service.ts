import { BaseService } from '../base.service';
import type { ListQueryParams } from '../../types/query-params';
import type {
  ReportQueryParams,
  DailyProductionReportItem,
  ProcessYieldReportItem,
  MachineUtilizationReportItem,
  ActualVsPredictedCostReportItem,
  MaterialCostBreakdownReportItem,
  DepartmentBudgetReportItem,
  VendorPerformanceReportItem,
  ProductCatalogReportItem,
  WorkflowBottleneckReportItem,
} from './types';

export interface ReportResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  isDatabaseGap?: boolean;
  gapMessage?: string;
  missingFields?: string[];
}

class ReportsService extends BaseService {
  constructor() {
    super({ basePath: '/reports' });
  }

  async getDailyProduction(
    params?: ReportQueryParams,
  ): Promise<ReportResponse<DailyProductionReportItem>> {
    return this.get<ReportResponse<DailyProductionReportItem>>(
      '/reports/production/daily',
      params as ListQueryParams,
    );
  }

  async getProcessYield(
    params?: ReportQueryParams,
  ): Promise<ReportResponse<ProcessYieldReportItem>> {
    return this.get<ReportResponse<ProcessYieldReportItem>>(
      '/reports/production/process-yield',
      params as ListQueryParams,
    );
  }

  async getMachineUtilization(
    params?: ReportQueryParams,
  ): Promise<ReportResponse<MachineUtilizationReportItem>> {
    return this.get<ReportResponse<MachineUtilizationReportItem>>(
      '/reports/production/machine-utilization',
      params as ListQueryParams,
    );
  }

  async getActualVsPredictedCosts(
    params?: ReportQueryParams,
  ): Promise<ReportResponse<ActualVsPredictedCostReportItem>> {
    return this.get<ReportResponse<ActualVsPredictedCostReportItem>>(
      '/reports/cost/actual-vs-predicted',
      params as ListQueryParams,
    );
  }

  async getMaterialCostBreakdown(
    params?: ReportQueryParams,
  ): Promise<ReportResponse<MaterialCostBreakdownReportItem>> {
    return this.get<ReportResponse<MaterialCostBreakdownReportItem>>(
      '/reports/cost/material-breakdown',
      params as ListQueryParams,
    );
  }

  async getDepartmentBudget(
    params?: ReportQueryParams,
  ): Promise<ReportResponse<DepartmentBudgetReportItem>> {
    return this.get<ReportResponse<DepartmentBudgetReportItem>>(
      '/reports/cost/department-budget',
      params as ListQueryParams,
    );
  }

  async getVendorPerformance(
    params?: ReportQueryParams,
  ): Promise<ReportResponse<VendorPerformanceReportItem>> {
    return this.get<ReportResponse<VendorPerformanceReportItem>>(
      '/reports/master-data/vendor-performance',
      params as ListQueryParams,
    );
  }

  async getProductCatalog(
    params?: ReportQueryParams,
  ): Promise<ReportResponse<ProductCatalogReportItem>> {
    return this.get<ReportResponse<ProductCatalogReportItem>>(
      '/reports/master-data/products',
      params as ListQueryParams,
    );
  }

  async getWorkflowBottleneck(
    params?: ReportQueryParams,
  ): Promise<ReportResponse<WorkflowBottleneckReportItem>> {
    return this.get<ReportResponse<WorkflowBottleneckReportItem>>(
      '/reports/workflow/bottleneck',
      params as ListQueryParams,
    );
  }
}

export const reportsService = new ReportsService();
export default reportsService;
