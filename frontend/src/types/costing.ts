export interface CostEstimation {
  indentId: string;
  totalEstimatedCost: number;
  approvedBudget: number;
  costBreakdown: {
    itemId: string;
    unitCost: number;
    totalCost: number;
  }[];
}
