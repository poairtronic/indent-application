import type { ListQueryParams } from '../../types/query-params';

export interface ReportQueryParams extends ListQueryParams {
  dateFrom?: string;
  dateTo?: string;
  productId?: string;
  departmentId?: string;
  vendorId?: string;
  materialId?: string;
  processCode?: string;
  status?: string;
}

export interface DailyProductionReportItem {
  id: string;
  indentNumber: string;
  productCode: string;
  productName: string;
  departmentCode: string;
  departmentName: string;
  priority: string;
  status: string;
  requiredDate: string;
  createdAt: string;
  receivedDate: string | null;
}

export interface ProcessYieldReportItem {
  indentProcessId: string;
  indentNumber: string;
  productCode: string;
  productName: string;
  processCode: string;
  processName: string;
  sequence: number;
  estimatedHours: number;
  actualHours: number | null;
  varianceHours: number | null;
  efficiencyPercentage: number | null;
  scrapFactor: number | null;
}

export interface MachineUtilizationReportItem {
  processCode: string;
  processName: string;
  totalIndentCount: number;
  totalEstimatedHours: number;
  totalActualHours: number | null;
  averageActualHours: number | null;
}

export interface ActualVsPredictedCostReportItem {
  id: string;
  costNumber: string;
  indentNumber: string;
  productCode: string;
  productName: string;
  predictedTotal: number;
  actualTotal: number | null;
  varianceAmount: number | null;
  variancePercentage: number | null;
  status: string;
  createdAt: string;
}

export interface MaterialCostBreakdownReportItem {
  materialId: string;
  materialCode: string;
  materialName: string;
  category: string;
  totalPredictedQty: number;
  totalActualQty: number | null;
  totalPredictedAmount: number;
  totalActualAmount: number | null;
  varianceAmount: number | null;
}

export interface DepartmentBudgetReportItem {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  totalPlannedCost: number;
  totalActualCost: number;
  varianceAmount: number;
  variancePercentage: number;
}

export interface VendorPerformanceReportItem {
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  totalCostItems: number;
  totalPredictedAmount: number;
  totalActualAmount: number | null;
  totalVariance: number | null;
  variancePercentage: number | null;
}

export interface ProductCatalogReportItem {
  id: string;
  productCode: string;
  productName: string;
  drawingNumber: string | null;
  revision: string | null;
  status: string;
  materialCount: number;
  processCount: number;
  activeIndentCount: number;
  createdAt: string;
}

export interface WorkflowBottleneckReportItem {
  stageId: string | null;
  stageName: string;
  totalTransactionsPassed: number;
  averageDurationHours: number;
  maxDurationHours: number;
  activeTransactionsCount: number;
}
