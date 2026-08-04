export interface ApiMeta {
  timestamp: string;
  path: string;
  version?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: ApiErrorDetail[];
  timestamp: string;
  path: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiMetaWithTotal {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

export type ListResponse<T> = ApiResponse<T[]>;

export type SuccessResponse = ApiResponse<null>;

export type MessageResponse = ApiResponse<{ message: string }>;

export type CreatedResponse<T> = ApiResponse<T>;

export interface NoContentResponse {
  success: boolean;
  message: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  uptime: number;
  timestamp: string;
}
