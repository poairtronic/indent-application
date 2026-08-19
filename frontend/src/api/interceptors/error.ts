import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  createApiError,
  UnauthorizedError,
  ForbiddenError,
  NetworkError,
  TimeoutError,
} from '../errors';
import { reportFrontendError } from '../utils/errorTelemetry';
import type { ApiErrorResponse } from '../types/api-response';
import { apiLogger } from '../utils/logger';
import { logSecurityDenial } from '../../utils/securityLogger';
import { apiClient } from '../client';

let isRefreshing = false;
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;
const REFRESH_TIMEOUT_MS = 10000;

interface QueueEntry {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let failedQueue: QueueEntry[] = [];

function processQueue(error: unknown, token: string | null = null): void {
  const currentQueue = [...failedQueue];
  failedQueue = [];
  for (const entry of currentQueue) {
    if (token) {
      entry.resolve(token);
    } else {
      entry.reject(error);
    }
  }
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

    // 1. Network / Timeout failures
    if (
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.message.includes('Network Error')
    ) {
      try {
        reportFrontendError(
          'API_OFFLINE_TIMEOUT',
          error.message || 'API Connection Failure',
          error.stack,
          originalRequest?.url,
        );
      } catch {
        // Telemetry must never crash error handling
      }

      if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
        throw new TimeoutError(error.message);
      }
      throw new NetworkError(error.message);
    }

    // 2. 403 Forbidden
    if (error.response?.status === 403) {
      onForbidden?.();
      try {
        logSecurityDenial(
          'API_ACCESS_DENIED',
          originalRequest.url || 'N/A',
          'API_FORBIDDEN_RESPONSE',
        );
      } catch {
        // Logging must never crash error handling
      }
      throw new ForbiddenError();
    }

    // 3. Non-401 errors or already-retried requests
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      !onAuthRefresh ||
      !onLogout
    ) {
      const status = error.response?.status ?? 0;
      const data = error.response?.data as ApiErrorResponse | any;
      let finalMessage = data?.message ?? error.message;
      if (Array.isArray(finalMessage)) {
        finalMessage = finalMessage.join(', ');
      }
      throw createApiError(status, finalMessage, data?.errors, originalRequest.url ?? undefined);
    }

    // 4. Do not refresh for auth/login or auth/refresh endpoints
    if (isRefreshEndpoint(originalRequest.url)) {
      const data = error.response?.data as ApiErrorResponse | any;
      let finalMessage = data?.message ?? error.message;
      if (Array.isArray(finalMessage)) {
        finalMessage = finalMessage.join(', ');
      }
      throw createApiError(
        error.response?.status ?? 401,
        finalMessage,
        data?.errors,
        originalRequest.url,
      );
    }

    // 5. Multi-Tab Optimization: Check if another tab refreshed the token while request was in-flight
    const storedAccessToken = localStorage.getItem('auth_access_token');
    const authHeader = (originalRequest.headers?.Authorization as string) || '';
    const requestToken = authHeader.replace(/^Bearer\s+/i, '');

    if (storedAccessToken && requestToken && storedAccessToken !== requestToken) {
      originalRequest._retry = true;
      if (!originalRequest.headers) {
        originalRequest.headers = {} as any;
      }
      originalRequest.headers.Authorization = `Bearer ${storedAccessToken}`;
      return apiClient(originalRequest) as Promise<never>;
    }

    // 6. Single-Flight Queueing
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest._retry = true;
        if (!originalRequest.headers) {
          originalRequest.headers = {} as any;
        }
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest) as Promise<never>;
      });
    }

    // 7. Max refresh attempts guard
    if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      processQueue(error, null);
      resetRefreshState();
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

      // 8. Bounded 10s timeout wrapper on refresh promise
      const refreshPromise = onAuthRefresh(refreshToken);
      const timeoutPromise = new Promise<{ accessToken: string; refreshToken: string }>(
        (_, reject) => {
          setTimeout(
            () => reject(new TimeoutError('Token refresh timed out after 10 seconds')),
            REFRESH_TIMEOUT_MS,
          );
        },
      );

      const { accessToken: newAccessToken } = await Promise.race([refreshPromise, timeoutPromise]);

      apiLogger.authRefresh(true);
      refreshAttempts = 0;
      processQueue(null, newAccessToken);

      if (!originalRequest.headers) {
        originalRequest.headers = {} as any;
      }
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return apiClient(originalRequest) as Promise<never>;
    } catch (refreshError) {
      apiLogger.authRefresh(false);
      processQueue(refreshError, null);
      resetRefreshState();
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
