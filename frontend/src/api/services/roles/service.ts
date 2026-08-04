import { BaseService } from '../base.service';
import type { RoleResponse } from '../../../types/user';

class RoleService extends BaseService {
  constructor() {
    super({ basePath: '/roles' });
  }

  async list(): Promise<RoleResponse[]> {
    return this.get<RoleResponse[]>('/roles');
  }

  async getPermissions(id: string): Promise<string[]> {
    return this.get<string[]>(`/roles/${id}/permissions`);
  }

  async updatePermissions(id: string, permissionIds: string[]): Promise<RoleResponse> {
    return this.put<RoleResponse>(`/roles/${id}/permissions`, permissionIds);
  }
}

export const roleService = new RoleService();
