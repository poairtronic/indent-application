import { BaseService } from '../base.service';
import type {
  UserResponse,
  PaginatedUsers,
  UserQueryParams,
  RoleOption,
  DepartmentOption,
  UserStatus,
} from '../../../types/user';
import type { ListQueryParams } from '../../types/query-params';

class UserService extends BaseService {
  constructor() {
    super({ basePath: '/users' });
  }

  async list(params: UserQueryParams): Promise<PaginatedUsers> {
    return this.getList<UserResponse>(params as ListQueryParams);
  }

  async getProfile(): Promise<UserResponse> {
    return this.get<UserResponse>('/users/profile');
  }

  async updateStatus(id: string, status: UserStatus): Promise<UserResponse> {
    return this.patch<UserResponse>(`${this.basePath}/${id}/status`, { status });
  }

  async listRoles(): Promise<RoleOption[]> {
    return this.get<RoleOption[]>('/roles');
  }

  async listDepartments(): Promise<DepartmentOption[]> {
    return this.get<DepartmentOption[]>('/departments');
  }

  async bulkRestore(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.restore(id);
    }
  }
}

export const userService = new UserService();
