import { BaseService } from '../base.service';
import type {
  DepartmentResponse,
  DepartmentOption,
  DepartmentQueryParams,
  PaginatedDepartments,
} from '../../types/department';
import type { ListQueryParams } from '../../types/query-params';

class DepartmentService extends BaseService {
  constructor() {
    super({ basePath: '/departments' });
  }

  async list(params: DepartmentQueryParams): Promise<PaginatedDepartments> {
    return this.getList<DepartmentResponse>(params as ListQueryParams);
  }

  async getOptions(): Promise<DepartmentOption[]> {
    const res = await this.get<any>('/departments');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.items)) return res.items;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  }
}

export const departmentService = new DepartmentService();
