import { BaseService } from '../base.service';
import type { PermissionAction } from '../../types/enums';

export interface PermissionResponse {
  id: string;
  module: string;
  action: PermissionAction;
  code: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionPayload {
  module: string;
  action: PermissionAction;
  code: string;
  description?: string;
}

export interface UpdatePermissionPayload {
  module?: string;
  action?: PermissionAction;
  code?: string;
  description?: string;
}

class PermissionService extends BaseService {
  constructor() {
    super({ basePath: '/permissions' });
  }

  async list(module?: string): Promise<PermissionResponse[]> {
    return this.get<PermissionResponse[]>('/permissions', module ? { module } : undefined);
  }

  async getModules(): Promise<string[]> {
    return this.get<string[]>('/permissions/modules');
  }
}

export const permissionService = new PermissionService();
