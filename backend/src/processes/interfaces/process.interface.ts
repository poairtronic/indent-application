import { ProcessStatus } from '@prisma/client';

export interface IManufacturingProcess {
  id: string;
  productId: string;
  processCode: string;
  processName: string;
  description?: string | null;
  sequence: number;
  estimatedHours: number;
  status: ProcessStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProcessFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  productId?: string;
  status?: ProcessStatus;
}
