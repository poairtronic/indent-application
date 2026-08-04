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
  totalCost: number;
  avgCompletionTime: number;
}

export interface WorkflowAnalytics {
  byState: Array<{ state: string; count: number }>;
  byDepartment: Array<{ department: string; count: number }>;
  avgTimeByState: Array<{ state: string; avgDays: number }>;
}

export interface DepartmentAnalytics {
  departmentId: string;
  departmentName: string;
  totalTransactions: number;
  completedTransactions: number;
  totalCost: number;
}

export interface CostAnalytics {
  totalPredicted: number;
  totalActual: number;
  totalVariance: number;
  variancePercentage: number;
  costByMaterial: Array<{
    materialId: string;
    materialName: string;
    predicted: number;
    actual: number;
  }>;
}

export interface ProductAnalytics {
  productId: string;
  productName: string;
  transactionCount: number;
  totalCost: number;
  avgCost: number;
}

export interface VendorAnalytics {
  vendorId: string;
  vendorName: string;
  transactionCount: number;
  totalCost: number;
  avgCost: number;
}
