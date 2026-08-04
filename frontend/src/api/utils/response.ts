import type { ApiResponse, PaginatedData } from '../types/api-response';

export function unwrap<T>(response: ApiResponse<T>): T {
  return response.data;
}

export function unwrapPaginated<T>(response: ApiResponse<PaginatedData<T>>): PaginatedData<T> {
  return response.data;
}

export function isSuccess<T>(response: ApiResponse<T>): boolean {
  return response.success === true;
}

export function getMessage<T>(response: ApiResponse<T>): string {
  return response.message;
}

export function getTimestamp<T>(response: ApiResponse<T>): string {
  return response.timestamp;
}
