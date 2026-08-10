export interface AnalyticsDateRange {
  from?: string;
  to?: string;
}

export type CostAnalyticsQuery = AnalyticsDateRange;

export interface ProductAnalyticsQuery {
  limit?: number;
}

export interface VendorAnalyticsQuery {
  limit?: number;
}

export interface AnalyticsSummary {
  totalTransactions: number;
  activeTransactions: number;
  completedTransactions: number;
  archivedTransactions: number;
  pendingTransactions: number;
  statusBreakdown: Array<{ status: string; count: number }>;
  generatedAt: string;
}

export interface WorkflowAnalytics {
  stageDistribution: Array<{ stageName: string; count: number; percentage: number }>;
  completionRate: number;
  averageCycleDays: number | null;
  bottleneckStage: string | null;
  stalledTransactions: number;
  generatedAt: string;
}

export interface DepartmentAnalytics {
  departments: Array<{
    departmentId: string;
    departmentName: string;
    departmentCode: string;
    totalTransactions: number;
    pendingQueue: number;
    completedCount: number;
  }>;
  highestWorkload: string | null;
  generatedAt: string;
}

export interface CostAnalytics {
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

export interface ProductAnalytics {
  products: Array<{
    productId: string;
    productCode: string;
    productName: string;
    indentCount: number;
    averagePlannedCost: number;
    averageActualCost: number | null;
    highestPlannedCost: number;
    lowestPlannedCost: number;
  }>;
  mostProducedProduct: string | null;
  highestCostProduct: string | null;
  lowestCostProduct: string | null;
  generatedAt: string;
}

export interface VendorAnalytics {
  vendors: Array<{
    vendorId: string;
    vendorCode: string;
    vendorName: string;
    totalCostItems: number;
    totalPredictedAmount: number;
    totalActualAmount: number | null;
    totalVariance: number | null;
    variancePercentage: number | null;
  }>;
  highestUsageVendor: string | null;
  bestPerformingVendor: string | null;
  generatedAt: string;
}

export interface KpiData {
  id: string;
  label: string;
  value: number;
  unit: 'count' | 'currency' | 'percentage' | 'hours';
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  comparisonPeriod: string;
  status: 'normal' | 'warning' | 'critical';
}
