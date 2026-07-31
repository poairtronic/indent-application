export interface UnitResponse {
  id: string;
  unitCode: string;
  unitName: string;
  symbol: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUnits {
  items: UnitResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnitQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateUnitPayload {
  unitCode: string;
  unitName: string;
  symbol: string;
}

export interface UpdateUnitPayload {
  unitCode?: string;
  unitName?: string;
  symbol?: string;
}
