import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { reportsService } from './service';
import type { ReportQueryParams } from './types';

export function useDailyProductionReport(params?: ReportQueryParams, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.reports.detail('reports', 'daily-production'), params],
    queryFn: () => reportsService.getDailyProduction(params),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useProcessYieldReport(params?: ReportQueryParams, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.reports.detail('reports', 'process-yield'), params],
    queryFn: () => reportsService.getProcessYield(params),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useMachineUtilizationReport(params?: ReportQueryParams, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.reports.detail('reports', 'machine-utilization'), params],
    queryFn: () => reportsService.getMachineUtilization(params),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useActualVsPredictedCostReport(params?: ReportQueryParams, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.reports.detail('reports', 'actual-vs-predicted'), params],
    queryFn: () => reportsService.getActualVsPredictedCosts(params),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useMaterialCostBreakdownReport(params?: ReportQueryParams, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.reports.detail('reports', 'material-breakdown'), params],
    queryFn: () => reportsService.getMaterialCostBreakdown(params),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useDepartmentBudgetReport(params?: ReportQueryParams, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.reports.detail('reports', 'department-budget'), params],
    queryFn: () => reportsService.getDepartmentBudget(params),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useVendorPerformanceReport(params?: ReportQueryParams, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.reports.detail('reports', 'vendor-performance'), params],
    queryFn: () => reportsService.getVendorPerformance(params),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useProductCatalogReport(params?: ReportQueryParams, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.reports.detail('reports', 'products'), params],
    queryFn: () => reportsService.getProductCatalog(params),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useWorkflowBottleneckReport(params?: ReportQueryParams, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.reports.detail('reports', 'workflow-bottleneck'), params],
    queryFn: () => reportsService.getWorkflowBottleneck(params),
    staleTime: 30 * 1000,
    enabled,
  });
}
