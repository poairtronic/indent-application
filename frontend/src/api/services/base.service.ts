import type { AxiosRequestConfig, CancelTokenSource } from 'axios';
import { apiClient, createCancelToken, isCancel } from '../client';
import type { ApiResponse, PaginatedData } from '../types/api-response';
import type { ListQueryParams } from '../types/query-params';
import { buildQueryParams } from '../utils/query-builder';
import { unwrap } from '../utils/response';
import { serializePayload } from '../utils/serializer';
import { ApiError, createApiError } from '../errors';

export interface ServiceConfig {
  basePath: string;
  timeout?: number;
}

export class BaseService {
  protected readonly basePath: string;
  protected readonly timeout: number;
  private activeRequests: Map<string, CancelTokenSource> = new Map();

  constructor(config: ServiceConfig) {
    this.basePath = config.basePath;
    this.timeout = config.timeout ?? 30000;
  }

  protected async get<T>(
    path: string,
    params?: ListQueryParams,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const queryParams = params ? buildQueryParams(params) : undefined;
    const response = await apiClient.get<ApiResponse<T>>(path, {
      params: queryParams,
      timeout: this.timeout,
      ...config,
    });
    return unwrap(response.data);
  }

  protected async getById<T>(id: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<ApiResponse<T>>(`${this.basePath}/${id}`, {
      timeout: this.timeout,
      ...config,
    });
    return unwrap(response.data);
  }

  protected async post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const payload =
      data && typeof data === 'object' ? serializePayload(data as Record<string, unknown>) : data;
    const response = await apiClient.post<ApiResponse<T>>(path, payload, {
      timeout: this.timeout,
      ...config,
    });
    return unwrap(response.data);
  }

  protected async put<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const payload =
      data && typeof data === 'object' ? serializePayload(data as Record<string, unknown>) : data;
    const response = await apiClient.put<ApiResponse<T>>(path, payload, {
      timeout: this.timeout,
      ...config,
    });
    return unwrap(response.data);
  }

  protected async patch<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const payload =
      data && typeof data === 'object' ? serializePayload(data as Record<string, unknown>) : data;
    const response = await apiClient.patch<ApiResponse<T>>(path, payload, {
      timeout: this.timeout,
      ...config,
    });
    return unwrap(response.data);
  }

  protected async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<ApiResponse<T>>(path, {
      timeout: this.timeout,
      ...config,
    });
    return unwrap(response.data);
  }

  protected async getList<T>(
    params?: ListQueryParams,
    config?: AxiosRequestConfig,
  ): Promise<PaginatedData<T>> {
    return this.get<PaginatedData<T>>(this.basePath, params, config);
  }

  protected async create<T>(data: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.post<T>(this.basePath, data, config);
  }

  protected async update<T>(id: string, data: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.patch<T>(`${this.basePath}/${id}`, data, config);
  }

  protected async remove<T>(id: string, config?: AxiosRequestConfig): Promise<T> {
    return this.delete<T>(`${this.basePath}/${id}`, config);
  }

  protected async restore<T>(id: string, config?: AxiosRequestConfig): Promise<T> {
    return this.patch<T>(`${this.basePath}/${id}/restore`, undefined, config);
  }

  protected createCancelToken(): CancelTokenSource {
    return createCancelToken();
  }

  protected trackRequest(key: string, cancelToken: CancelTokenSource): void {
    this.cancelRequest(key);
    this.activeRequests.set(key, cancelToken);
  }

  protected cancelRequest(requestKey: string): void {
    const existing = this.activeRequests.get(requestKey);
    if (existing) {
      existing.cancel('Request cancelled');
      this.activeRequests.delete(requestKey);
    }
  }

  protected cancelAllRequests(): void {
    for (const [, source] of this.activeRequests) {
      source.cancel('All requests cancelled');
    }
    this.activeRequests.clear();
  }

  isRequestCancelled(error: unknown): boolean {
    return isCancel(error);
  }

  protected handleError(error: unknown): never {
    if (error instanceof ApiError) throw error;
    if (isCancel(error)) throw error;

    const axiosError = error as {
      response?: {
        status: number;
        data?: {
          message?: string;
          errors?: Array<{ field?: string; message: string; code?: string }>;
        };
      };
      message?: string;
    };
    if (axiosError.response) {
      throw createApiError(
        axiosError.response.status,
        axiosError.response.data?.message,
        axiosError.response.data?.errors,
        this.basePath,
      );
    }
    throw createApiError(0, axiosError.message);
  }
}
