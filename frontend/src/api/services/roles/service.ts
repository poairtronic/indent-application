import { BaseService } from '../base.service';
import type { RoleResponse } from '../../../types/user';

class RoleService extends BaseService {
  constructor() {
    super({ basePath: '/roles' });
  }

  async list(): Promise<RoleResponse[]> {
    return this.get<RoleResponse[]>('/roles');
  }

  async update<T = RoleResponse>(id: string, data: unknown): Promise<T> {
    return this.put<T>(`/roles/${id}`, data);
  }

  async getPermissions(id: string): Promise<string[]> {
    return this.get<string[]>(`/roles/${id}/permissions`);
  }

  async updatePermissions(id: string, permissionIds: string[]): Promise<RoleResponse> {
    return this.put<RoleResponse>(`/roles/${id}/permissions`, permissionIds);
  }
}

export const roleService = new RoleService();
