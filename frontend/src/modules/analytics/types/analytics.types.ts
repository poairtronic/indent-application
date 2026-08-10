/**
 * Phase 15B - Frontend Analytics TypeScript Type Definitions
 * Matches Phase 15A Backend specifications.
 */

export interface ITransactionStatusBreakdown {
  status: string;
  count: number;
}

export interface IExecutiveSummary {
  totalTransactions: number;
  activeTransactions: number;
  completedTransactions: number;
  archivedTransactions: number;
  pendingTransactions: number;
  statusBreakdown: ITransactionStatusBreakdown[];
  generatedAt: string;
}

export interface IStageDistribution {
  stageName: string;
  count: number;
  percentage: number;
}

export interface IWorkflowAnalytics {
  stageDistribution: IStageDistribution[];
  completionRate: number;
  averageCycleDays: number | null;
  bottleneckStage: string | null;
  stalledTransactions: number;
  generatedAt: string;
}

export interface IDepartmentWorkload {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  totalTransactions: number;
  pendingQueue: number;
  completedCount: number;
}

export interface IDepartmentAnalytics {
  departments: IDepartmentWorkload[];
  highestWorkload: string | null;
  generatedAt: string;
}

export interface ICostAnalytics {
  totalPlannedCost: number;
  totalActualCost: number;
  totalVarianceAmount: number;
  averageVariancePercentage: number;
  costSheetsWithActuals: number;
  finalizedCostSheets: number;
  draftCostSheets: number;
  dateRange: { from: string | null; to: string | null };
  generatedAt: string;
}

export interface IProductStat {
  productId: string;
  productCode: string;
  productName: string;
  indentCount: number;
  averagePlannedCost: number;
  averageActualCost: number | null;
  highestPlannedCost: number;
  lowestPlannedCost: number;
}

export interface IProductAnalytics {
  products: IProductStat[];
  mostProducedProduct: string | null;
  highestCostProduct: string | null;
  lowestCostProduct: string | null;
  generatedAt: string;
}

export interface IVendorStat {
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  totalCostItems: number;
  totalPredictedAmount: number;
  totalActualAmount: number | null;
  totalVariance: number | null;
  variancePercentage: number | null;
}

export interface IVendorAnalytics {
  vendors: IVendorStat[];
  highestUsageVendor: string | null;
  bestPerformingVendor: string | null;
  generatedAt: string;
}

export interface IAnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  productId?: string;
  vendorId?: string;
  status?: string;
  limit?: number;
}

export interface IKpiData {
  id: string;
  label: string;
  value: number;
  unit: 'count' | 'currency' | 'percentage' | 'hours';
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  comparisonPeriod: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface IInsight {
  type: string;
  title: string;
  message: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  metric: string;
  value: number | string;
  comparisonValue?: number | string | null;
  change?: number | null;
  changePercentage?: number | null;
  direction?: 'up' | 'down' | 'stable' | null;
  period?: string | null;
}

export interface IInsightsSummary {
  insights: IInsight[];
  summaryText: string;
  generatedAt: string;
}
