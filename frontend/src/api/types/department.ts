export interface DepartmentResponse {
  id: string;
  departmentCode: string;
  departmentName: string;
  description?: string | null;
  headId?: string | null;
  headName?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentOption {
  id: string;
  departmentCode: string;
  departmentName: string;
}

export interface CreateDepartmentPayload {
  departmentCode: string;
  departmentName: string;
  description?: string;
  headId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateDepartmentPayload {
  departmentCode?: string;
  departmentName?: string;
  description?: string;
  headId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface DepartmentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export type PaginatedDepartments = import('./api-response').PaginatedData<DepartmentResponse>;
