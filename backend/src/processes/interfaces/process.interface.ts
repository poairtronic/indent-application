import { ProcessStatus } from '@prisma/client';

export interface IManufacturingProcess {
  id: string;
  processName: string;
  description?: string | null;
  status: ProcessStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProcessFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProcessStatus;
}
