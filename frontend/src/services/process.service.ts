import { apiClient } from '../lib/axios';
import type {
  CreateProcessPayload,
  PaginatedProcesses,
  ProcessQueryParams,
  ProcessResponse,
  UpdateProcessPayload,
} from '../types/process';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const unwrap = <T>(response: { data: ApiResponse<T> }): T => response.data.data;

export const processService = {
  async list(params: ProcessQueryParams): Promise<PaginatedProcesses> {
    return unwrap(await apiClient.get('/manufacturing-processes', { params }));
  },
  async getById(id: string): Promise<ProcessResponse> {
    return unwrap(await apiClient.get(`/manufacturing-processes/${id}`));
  },
  async create(payload: CreateProcessPayload): Promise<ProcessResponse> {
    return unwrap(await apiClient.post('/manufacturing-processes', payload));
  },
  async update(id: string, payload: UpdateProcessPayload): Promise<ProcessResponse> {
    return unwrap(await apiClient.patch(`/manufacturing-processes/${id}`, payload));
  },
  async remove(id: string): Promise<{ message: string }> {
    return unwrap(await apiClient.delete(`/manufacturing-processes/${id}`));
  },
  async restore(id: string): Promise<ProcessResponse> {
    return unwrap(await apiClient.patch(`/manufacturing-processes/${id}/restore`));
  },
};
