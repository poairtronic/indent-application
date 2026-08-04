import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { createApiError, UnauthorizedError, ForbiddenError } from '../errors';
import type { ApiErrorResponse } from '../types/api-response';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  for (const prom of failedQueue) {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  }
  failedQueue = [];
}

export function createErrorInterceptor(
  onAuthRefresh?: (refreshToken: string) => Promise<{ accessToken: string; refreshToken: string }>,
  onLogout?: () => void,
  onForbidden?: () => void,
) {
  return async (error: AxiosError): Promise<never> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 403) {
      onForbidden?.();
      throw new ForbiddenError();
    }

    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      !onAuthRefresh ||
      !onLogout
    ) {
      const status = error.response?.status ?? 0;
      const data = error.response?.data as ApiErrorResponse | undefined;
      throw createApiError(
        status,
        data?.message ?? error.message,
        data?.errors,
        originalRequest.url ?? undefined,
      );
    }

    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      throw createApiError(401, error.message);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return import('axios').then(({ default: axios }) => axios(originalRequest));
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('auth_refresh_token');
      if (!refreshToken) {
        throw new UnauthorizedError('No refresh token available');
      }

      const { accessToken: newAccessToken } = await onAuthRefresh(refreshToken);

      processQueue(null, newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return import('axios').then(({ default: axios }) => axios(originalRequest));
    } catch (refreshError) {
      processQueue(refreshError, null);
      onLogout();
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  };
}
