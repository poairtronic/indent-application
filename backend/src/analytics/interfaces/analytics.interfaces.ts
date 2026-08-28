/**
 * Analytics & Executive Intelligence — TypeScript Interfaces
 * Phase 15A – Backend Foundation
 * READ-ONLY: no mutations, no schema changes.
 */

// ─────────────────────────────────────────────
// Executive Summary
// ─────────────────────────────────────────────

export interface ITransactionStatusBreakdown {
  status: string;
  count: number;
}

export interface IExecutiveSummary {
  /** Total business transactions in the system (excluding soft-deleted) */
  totalTransactions: number;
  /** Transactions currently in an active manufacturing or financial stage */
  activeTransactions: number;
  /** Transactions in COMPLETED state */
  completedTransactions: number;
  /** Transactions in ARCHIVED state */
  archivedTransactions: number;
  /** Transactions in DRAFT or any pending state (not completed/archived) */
  pendingTransactions: number;
  /** Breakdown by each workflow status */
  statusBreakdown: ITransactionStatusBreakdown[];
  /** Snapshot timestamp */
  generatedAt: Date;
}

// ─────────────────────────────────────────────
// Workflow Analytics
// ─────────────────────────────────────────────

export interface IStageDistribution {
  /** Human-readable domain workflow state name */
  stageName: string;
  /** Number of transactions in this stage */
  count: number;
  /** Percentage of all active transactions */
  percentage: number;
}

export interface IWorkflowAnalytics {
  /** Distribution of transactions across all workflow stages */
  stageDistribution: IStageDistribution[];
  /** Overall completion rate (completed / total) as a percentage */
  completionRate: number;
  /** Average days from creation to completion for COMPLETED transactions */
  averageCycleDays: number | null;
  /** Stage with the highest number of currently stalled transactions */
  bottleneckStage: string | null;
  /** Number of transactions that have been in the same state for > 7 days */
  stalledTransactions: number;
  /** Snapshot timestamp */
  generatedAt: Date;
}

// ─────────────────────────────────────────────
// Department Analytics
// ─────────────────────────────────────────────

export interface IDepartmentWorkload {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  /** Transactions currently assigned to / originated from this department */
  totalTransactions: number;
  /** Transactions in a pending/active state for this department */
  pendingQueue: number;
  /** Transactions that have been completed involving this department */
  completedCount: number;
}

export interface IDepartmentAnalytics {
  departments: IDepartmentWorkload[];
  /** Department with the highest pending queue */
  highestWorkload: string | null;
  /** Snapshot timestamp */
  generatedAt: Date;
}

// ─────────────────────────────────────────────
// Cost Analytics
// ─────────────────────────────────────────────

export interface ICostAnalytics {
  /** Total planned (predicted) cost across all cost sheets */
  totalPlannedCost: number;
  /** Total planned cost for finalized cost sheets only */
  totalFinalizedPlannedCost: number;
  /** Total actual cost across finalized cost sheets */
  totalActualCost: number;
  /** Total variance amount (actual - planned) for finalized cost sheets */
  totalVarianceAmount: number;
  /** Average variance percentage across finalized sheets */
  averageVariancePercentage: number;
  /** Number of cost sheets with actual costs entered */
  costSheetsWithActuals: number;
  /** Number of finalized cost sheets */
  finalizedCostSheets: number;
  /** Number of draft cost sheets */
  draftCostSheets: number;
  /** Date range applied to the query */
  dateRange: { from: Date | null; to: Date | null };
  /** Snapshot timestamp */
  generatedAt: Date;
}

// ─────────────────────────────────────────────
// Product Analytics
// ─────────────────────────────────────────────

export interface IProductStat {
  productId: string;
  productCode: string;
  productName: string;
  /** Total times this product has been indented */
  indentCount: number;
  /** Average planned cost across all cost sheets for this product */
  averagePlannedCost: number;
  /** Average actual cost across finalized cost sheets for this product */
  averageActualCost: number | null;
  /** Highest planned cost ever recorded */
  highestPlannedCost: number;
  /** Lowest planned cost ever recorded */
  lowestPlannedCost: number;
}

export interface IProductAnalytics {
  products: IProductStat[];
  /** Product with the most indents */
  mostProducedProduct: string | null;
  /** Product with the highest average planned cost */
  highestCostProduct: string | null;
  /** Product with the lowest average planned cost */
  lowestCostProduct: string | null;
  /** Snapshot timestamp */
  generatedAt: Date;
}

// ─────────────────────────────────────────────
// Vendor Analytics
// ─────────────────────────────────────────────

export interface IVendorStat {
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  /** Total number of cost items attributed to this vendor */
  totalCostItems: number;
  /** Total predicted amount supplied by this vendor */
  totalPredictedAmount: number;
  /** Total actual amount (where entered) */
  totalActualAmount: number | null;
  /** Variance = actual - predicted */
  totalVariance: number | null;
  /** Variance as percentage of predicted */
  variancePercentage: number | null;
}

export interface IVendorAnalytics {
  vendors: IVendorStat[];
  /** Vendor with highest total supply value */
  highestUsageVendor: string | null;
  /** Vendor with best cost adherence (lowest variance %) */
  bestPerformingVendor: string | null;
  /** Snapshot timestamp */
  generatedAt: Date;
}

// ─────────────────────────────────────────────
// Business Insights Analytics
// ─────────────────────────────────────────────

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
  generatedAt: Date;
}

export interface IVendorProcessAllocation {
  vendorName: string;
  processName: string;
  indentsCount: number;
  totalPredictedCost: number;
  totalActualCost: number;
  variance: number;
}

