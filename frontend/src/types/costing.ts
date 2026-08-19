import type { CostSheetStatus, VendorProcessType } from '../api/types/enums';

export type { CostSheetStatus, VendorProcessType };

export interface CostItem {
  id: string;
  materialId: string;
  material?: { id: string; materialName: string };
  vendorId?: string;
  vendor?: { id: string; vendorName: string };
  predictedRate: number;
  predictedQuantity: number;
  predictedAmount: number;
  actualRate?: number;
  actualQuantity?: number;
  actualAmount?: number;
  varianceAmount?: number;
  variancePercentage?: number;
  remarks?: string;
}

export interface ProcessCost {
  id: string;
  processId: string;
  process?: { id: string; processName: string };
  predictedCost: number;
  estimatedHours?: number;
  vendorType: VendorProcessType;
  vendorId?: string;
  actualCost?: number;
  actualHours?: number;
  varianceAmount?: number;
  variancePercentage?: number;
  remarks?: string;
}

export interface CostSheet {
  id: string;
  costNumber: string;
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
