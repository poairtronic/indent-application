import type { AxiosRequestConfig, CancelTokenSource } from 'axios';
import { apiClient, createCancelToken, isCancel } from '../client';
import type { ApiResponse, PaginatedData } from '../types/api-response';
import type { ListQueryParams } from '../types/query-params';
import { buildQueryParams } from '../utils/query-builder';
import { unwrap } from '../utils/response';
import { serializePayload } from '../utils/serializer';
import { ApiError, createApiError } from '../errors';
import { TIMEOUTS } from '../constants';

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
    this.timeout = config.timeout ?? TIMEOUTS.DEFAULT;
  }

  async get<T>(path: string, params?: ListQueryParams, config?: AxiosRequestConfig): Promise<T> {
    const queryParams = params ? buildQueryParams(params) : undefined;
    const response = await apiClient.get<ApiResponse<T>>(path, {
      params: queryParams,
      timeout: this.timeout,
      ...config,
    });
    return unwrap(response.data);
  }

  async getRaw<T>(
    path: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await apiClient.get<ApiResponse<T>>(path, {
      params,
      timeout: this.timeout,
      ...config,
    });
    return unwrap(response.data);
  }

  async getById<T>(id: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<ApiResponse<T>>(`${this.basePath}/${id}`, {
      timeout: this.timeout,
      ...config,
    });
    return unwrap(response.data);
  }

  async post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const payload =
      data && typeof data === 'object' ? serializePayload(data as Record<string, unknown>) : data;
    const response = await apiClient.post<ApiResponse<T>>(path, payload, {
      timeout: this.timeout,
      ...config,
    });
    return unwrap(response.data);
  }

  async put<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const payload =
      data && typeof data === 'object' ? serializePayload(data as Record<string, unknown>) : data;
    const response = await apiClient.put<ApiResponse<T>>(path, payload, {
      timeout: this.timeout,
      ...config,
    });
    return unwrap(response.data);
  }

  async patch<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const payload =
      data && typeof data === 'object' ? serializePayload(data as Record<string, unknown>) : data;
    const response = await apiClient.patch<ApiResponse<T>>(path, payload, {
      timeout: this.timeout,
      ...config,
    });
    return unwrap(response.data);
  }

  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<ApiResponse<T>>(path, {
      timeout: this.timeout,
      ...config,
    });
    return unwrap(response.data);
  }

  async getList<T>(
    params?: ListQueryParams,
    config?: AxiosRequestConfig,
  ): Promise<PaginatedData<T>> {
    // The backend returns { data: T[], meta: { total, page, limit, totalPages } }
    // but the frontend expects { items: T[], total, page, limit, totalPages }
    const result = await this.get<any>(this.basePath, params, config);
    if (result && Array.isArray(result.data) && result.meta) {
      return {
        items: result.data,
        total: result.meta.total,
        page: result.meta.page,
        limit: result.meta.limit,
        totalPages: result.meta.totalPages,
      };
    }
    // Fallback if the backend already matches PaginatedData or it's an array directly
    if (Array.isArray(result)) {
      return { items: result, total: result.length, page: 1, limit: result.length, totalPages: 1 };
    }
    return result as PaginatedData<T>;
  }

  async create<T>(data: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.post<T>(this.basePath, data, config);
  }

  async update<T>(id: string, data: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.patch<T>(`${this.basePath}/${id}`, data, config);
  }

  async remove<T>(id: string, config?: AxiosRequestConfig): Promise<T> {
    return this.delete<T>(`${this.basePath}/${id}`, config);
  }

  async restore<T>(id: string, config?: AxiosRequestConfig): Promise<T> {
    return this.patch<T>(`${this.basePath}/${id}/restore`, undefined, config);
  }

  async upload<T>(
    path: string,
    file: File,
    additionalData?: Record<string, string>,
    onProgress?: (progress: number) => void,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      for (const [key, value] of Object.entries(additionalData)) {
        formData.append(key, value);
      }
    }

    const response = await apiClient.post<ApiResponse<T>>(path, formData, {
      timeout: TIMEOUTS.UPLOAD,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (progressEvent) => {
            const percent = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            onProgress(percent);
          }
        : undefined,
      ...config,
    });
    return unwrap(response.data);
  }

  async download(path: string, filename: string, config?: AxiosRequestConfig): Promise<void> {
    const response = await apiClient.get(path, {
      responseType: 'blob',
      timeout: TIMEOUTS.UPLOAD,
      ...config,
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async bulkCreate<T>(data: unknown[], config?: AxiosRequestConfig): Promise<T[]> {
    const results: T[] = [];
    const promises = data.map((item) => this.create<T>(item, config));
    const settled = await Promise.allSettled(promises);

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        throw result.reason;
      }
    }

    return results;
  }

  async bulkRemove(ids: string[], config?: AxiosRequestConfig): Promise<void> {
    const promises = ids.map((id) => this.remove(id, config));
    await Promise.allSettled(promises);
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
