export type ProcessStatus = 'ACTIVE' | 'INACTIVE';

export interface ProcessResponse {
  id: string;
  processName: string;
  description?: string | null;
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
  status?: ProcessStatus;
}

export interface CreateProcessPayload {
  processName: string;
  description?: string;
  status?: ProcessStatus;
}

export interface UpdateProcessPayload {
  processName?: string;
  description?: string;
  status?: ProcessStatus;
}
