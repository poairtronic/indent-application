export type CostSheetStatus = 'DRAFT' | 'PENDING_VERIFICATION' | 'FINALIZED' | 'CLOSED';

export interface CostItem {
  id: string;
  costSheetId: string;
  materialId: string;
  vendorId?: string;
  predictedRate: number;
  predictedQuantity: number;
  predictedAmount: number;
  actualRate?: number;
  actualQuantity?: number;
  actualAmount?: number;
  varianceAmount?: number;
  variancePercentage?: number;
  remarks?: string;
  // Relations
  material?: any; // To be mapped with proper Material type
  vendor?: any;
}

export type VendorProcessType = 'IN_HOUSE' | 'OUTSOURCED';

export interface ProcessCost {
  id: string;
  costSheetId: string;
  processId: string;
  predictedCost: number;
  estimatedHours: number;
  vendorType: VendorProcessType;
  vendorId?: string;
  actualCost?: number;
  actualHours?: number;
  varianceAmount?: number;
  variancePercentage?: number;
  remarks?: string;
  // Relations
  process?: any;
}

export interface CostSheet {
  id: string;
  costNumber: string;
  indentId: string;
  preparedBy: string;
  predictedTotal: number;
  actualTotal?: number;
  varianceAmount?: number;
  variancePercentage?: number;
  status: CostSheetStatus;
  
  costItems: CostItem[];
  processCosts: ProcessCost[];
  
  createdAt: string;
  updatedAt: string;
}
