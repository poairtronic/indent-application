import { apiClient } from '../lib/axios';
import type {
  CreateVendorPayload,
  PaginatedVendors,
  UpdateVendorPayload,
  VendorQueryParams,
  VendorResponse,
} from '../types/vendor';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const unwrap = <T>(response: { data: ApiResponse<T> }): T => response.data.data;

export const vendorService = {
  async list(params: VendorQueryParams): Promise<PaginatedVendors> {
    return unwrap(await apiClient.get('/vendors', { params }));
  },
  async getById(id: string): Promise<VendorResponse> {
    return unwrap(await apiClient.get(`/vendors/${id}`));
  },
  async create(payload: CreateVendorPayload): Promise<VendorResponse> {
    return unwrap(await apiClient.post('/vendors', payload));
  },
  async update(id: string, payload: UpdateVendorPayload): Promise<VendorResponse> {
    return unwrap(await apiClient.patch(`/vendors/${id}`, payload));
  },
  async remove(id: string): Promise<{ message: string }> {
    return unwrap(await apiClient.delete(`/vendors/${id}`));
  },
  async restore(id: string): Promise<VendorResponse> {
    return unwrap(await apiClient.patch(`/vendors/${id}/restore`));
  },
};
