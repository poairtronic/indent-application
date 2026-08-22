import type { ApiResponse, PaginatedData } from '../types/api-response';

export function unwrap<T>(response: any): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }
  return response;
}

export function unwrapPaginated<T>(response: any): PaginatedData<T> {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }
  return response;
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
