import { apiClient } from '../lib/axios';
import type {
  CreateUnitPayload,
  PaginatedUnits,
  UnitQueryParams,
  UnitResponse,
  UpdateUnitPayload,
} from '../types/unit';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const unwrap = <T>(response: { data: ApiResponse<T> }): T => response.data.data;

export const unitService = {
  async list(params: UnitQueryParams): Promise<PaginatedUnits> {
    return unwrap(await apiClient.get('/units', { params }));
  },
  async getById(id: string): Promise<UnitResponse> {
    return unwrap(await apiClient.get(`/units/${id}`));
  },
  async create(payload: CreateUnitPayload): Promise<UnitResponse> {
    return unwrap(await apiClient.post('/units', payload));
  },
  async update(id: string, payload: UpdateUnitPayload): Promise<UnitResponse> {
    return unwrap(await apiClient.patch(`/units/${id}`, payload));
  },
  async remove(id: string): Promise<{ message: string }> {
    return unwrap(await apiClient.delete(`/units/${id}`));
  },
  async restore(id: string): Promise<UnitResponse> {
    return unwrap(await apiClient.patch(`/units/${id}/restore`));
  },
};
