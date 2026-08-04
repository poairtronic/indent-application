export interface MaterialResponse {
  id: string;
  materialCode: string;
  materialName: string;
  description?: string | null;
  unitId: string;
  unitName?: string;
  category?: string | null;
  minStock?: number | null;
  maxStock?: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialPayload {
  materialCode: string;
  materialName: string;
  description?: string;
  unitId: string;
  category?: string;
  minStock?: number;
  maxStock?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateMaterialPayload {
  materialCode?: string;
  materialName?: string;
  description?: string;
  unitId?: string;
  category?: string;
  minStock?: number;
  maxStock?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface MaterialQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export type PaginatedMaterials = import('./api-response').PaginatedData<MaterialResponse>;
