import { apiClient } from '../lib/axios';
import type {
  CreateUserPayload,
  PaginatedUsers,
  RoleOption,
  UpdateUserPayload,
  UserQueryParams,
  UserResponse,
  UserStatus,
} from '../types/user';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const unwrap = <T>(response: { data: ApiResponse<T> }): T => response.data.data;

export const userService = {
  async list(params: UserQueryParams): Promise<PaginatedUsers> {
    return unwrap(await apiClient.get('/users', { params }));
  },

  async getById(id: string): Promise<UserResponse> {
    return unwrap(await apiClient.get(`/users/${id}`));
  },

  async getProfile(): Promise<UserResponse> {
    return unwrap(await apiClient.get('/users/profile'));
  },

  async create(payload: CreateUserPayload): Promise<UserResponse> {
    return unwrap(await apiClient.post('/users', payload));
  },

  async update(id: string, payload: UpdateUserPayload): Promise<UserResponse> {
    return unwrap(await apiClient.patch(`/users/${id}`, payload));
  },

  async updateStatus(id: string, status: UserStatus): Promise<UserResponse> {
    return unwrap(await apiClient.patch(`/users/${id}/status`, { status }));
  },

  async remove(id: string): Promise<{ message: string }> {
    return unwrap(await apiClient.delete(`/users/${id}`));
  },

  async restore(id: string): Promise<UserResponse> {
    return unwrap(await apiClient.patch(`/users/${id}/restore`));
  },

  async listRoles(): Promise<RoleOption[]> {
    return unwrap(await apiClient.get('/roles'));
  },
};
