export interface ReportResponseMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReportResponse<T> {
  data: T[];
  meta: ReportResponseMeta;
  isDatabaseGap?: boolean;
  gapMessage?: string;
  missingFields?: string[];
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
  requiredDate: Date;
  createdAt: Date;
  receivedDate: Date | null;
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
  scrapFactor: number | null; // From ProductMaterial
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
  createdAt: Date;
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
  createdAt: Date;
}

export interface WorkflowBottleneckReportItem {
  stageId: string | null;
  stageName: string;
  totalTransactionsPassed: number;
  averageDurationHours: number;
  maxDurationHours: number;
  activeTransactionsCount: number;
}
