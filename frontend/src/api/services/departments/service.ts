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
    return this.get<DepartmentOption[]>('/departments');
  }
}

export const departmentService = new DepartmentService();
