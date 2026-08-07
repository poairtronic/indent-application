import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { createApiError, UnauthorizedError, ForbiddenError } from '../errors';
import type { ApiErrorResponse } from '../types/api-response';
import { apiLogger } from '../utils/logger';
import { logSecurityDenial } from '../../utils/securityLogger';
import {
  shouldRetry,
  calculateRetryDelay,
  getRetryAttempt,
  incrementRetryAttempt,
  sleep,
} from '../utils/retry';
import { DEFAULT_RETRY_CONFIG } from '../utils/retry';
import type { RetryConfig } from '../utils/retry';

let isRefreshing = false;
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;

interface QueueEntry {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let failedQueue: QueueEntry[] = [];

function processQueue(error: unknown, token: string | null = null): void {
  for (const entry of failedQueue) {
    if (token) {
      entry.resolve(token);
    } else {
      entry.reject(error);
    }
  }
  failedQueue = [];
}

function isRefreshEndpoint(url?: string): boolean {
  return !!url && (url.includes('/auth/login') || url.includes('/auth/refresh'));
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
      logSecurityDenial('API_ACCESS_DENIED', originalRequest.url || 'N/A', 'API_FORBIDDEN_RESPONSE');
      throw new ForbiddenError();
    }

    const retryConfig: RetryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...originalRequest.retry,
    };
    const currentAttempt = getRetryAttempt(originalRequest);

    if (!originalRequest.skipRetry && shouldRetry(error, currentAttempt, retryConfig)) {
      incrementRetryAttempt(originalRequest);
      const delay = calculateRetryDelay(
        currentAttempt,
        retryConfig,
        error.response?.headers?.['retry-after'],
      );

      apiLogger.retryAttempt(originalRequest.metadata?.requestId ?? '', currentAttempt + 1, delay);

      await sleep(delay);
      return import('axios').then(({ default: axios }) => axios(originalRequest));
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

    if (isRefreshEndpoint(originalRequest.url)) {
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

    if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      processQueue(error, null);
      onLogout();
      throw new UnauthorizedError('Maximum refresh attempts exceeded');
    }

    originalRequest._retry = true;
    isRefreshing = true;
    refreshAttempts++;

    try {
      const refreshToken = localStorage.getItem('auth_refresh_token');
      if (!refreshToken) {
        throw new UnauthorizedError('No refresh token available');
      }

      const { accessToken: newAccessToken } = await onAuthRefresh(refreshToken);

      apiLogger.authRefresh(true);
      refreshAttempts = 0;
      processQueue(null, newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return import('axios').then(({ default: axios }) => axios(originalRequest));
    } catch (refreshError) {
      apiLogger.authRefresh(false);
      processQueue(refreshError, null);
      onLogout();
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  };
}

export function resetRefreshState(): void {
  isRefreshing = false;
  refreshAttempts = 0;
  failedQueue = [];
}
