export type ProcessStatus = 'ACTIVE' | 'INACTIVE';

export interface ProcessResponse {
  id: string;
  productId: string;
  productCode?: string;
  processCode: string;
  processName: string;
  description?: string | null;
  sequence: number;
  estimatedHours: number;
  status: ProcessStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProcesses {
  items: ProcessResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProcessQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  productId?: string;
  status?: ProcessStatus;
}

export interface CreateProcessPayload {
  productId: string;
  processCode: string;
  processName: string;
  description?: string;
  sequence: number;
  estimatedHours?: number;
  status?: ProcessStatus;
}

export interface UpdateProcessPayload {
  productId?: string;
  processCode?: string;
  processName?: string;
  description?: string;
  sequence?: number;
  estimatedHours?: number;
  status?: ProcessStatus;
}
