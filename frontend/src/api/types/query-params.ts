export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'startsWith'
  | 'endsWith';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[];
}

export interface FilterParams {
  filters?: FilterCondition[];
}

export interface SearchParams {
  search?: string;
  searchFields?: string[];
}

export interface ListQueryParams extends PaginationParams, SortParams, FilterParams, SearchParams {
  [key: string]: string | number | boolean | string[] | FilterCondition[] | undefined;
}
