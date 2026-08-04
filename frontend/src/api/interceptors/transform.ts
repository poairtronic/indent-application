import type { AxiosResponse } from 'axios';
import type { ApiResponse } from '../types/api-response';

export function createResponseTransformer() {
  return (response: AxiosResponse): AxiosResponse => {
    return response;
  };
}

export function extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  return response.data.data;
}

export function extractMessage<T>(response: AxiosResponse<ApiResponse<T>>): string {
  return response.data.message;
}

export function isSuccessResponse<T>(response: AxiosResponse<ApiResponse<T>>): boolean {
  return response.data.success === true;
}
