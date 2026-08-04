export interface ProductResponse {
  id: string;
  productCode: string;
  productName: string;
  description?: string | null;
  departmentId?: string | null;
  departmentName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  productCode: string;
  productName: string;
  description?: string;
  departmentId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateProductPayload {
  productCode?: string;
  productName?: string;
  description?: string;
  departmentId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export type PaginatedProducts = import('./api-response').PaginatedData<ProductResponse>;
