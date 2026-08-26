import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, CancelTokenSource } from 'axios';
import { apiConfig, featureFlags } from '../config';
import { TIMEOUTS } from '../constants';
import { createAuthInterceptor } from '../interceptors/auth';
import { createRequestLogger, createResponseLogger } from '../interceptors/logging';
import { createErrorInterceptor, resetRefreshState } from '../interceptors/error';
import { createHeaderInterceptor } from '../interceptors/headers';
import { useAuthStore } from '../../store/authStore';
import { cancelAllRequests, cleanupStaleRequests } from '../utils/cancellation';
import { apiLogger } from '../utils/logger';

let clientInstance: AxiosInstance | null = null;

function createApiClient(): AxiosInstance {
  if (clientInstance) return clientInstance;

  const client = axios.create({
    baseURL: apiConfig.baseURL,
    timeout: TIMEOUTS.DEFAULT,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    withCredentials: true,
  });

  client.interceptors.request.use(createHeaderInterceptor());
  client.interceptors.request.use(createAuthInterceptor());
  client.interceptors.request.use(createRequestLogger(featureFlags.enableRequestLogging));

  client.interceptors.response.use(createResponseLogger(featureFlags.enableResponseLogging));

  client.interceptors.response.use(
    (response) => response,
    createErrorInterceptor(
      async (refreshToken: string) => {
        const response = await axios.post(
          `${apiConfig.baseURL}/auth/refresh`,
          { refreshToken },
          { timeout: TIMEOUTS.AUTH_REFRESH || 10000 },
        );
        const data = response.data?.data || response.data;
        const { accessToken, refreshToken: newRefreshToken, user } = data;
        useAuthStore.getState().login(accessToken, newRefreshToken, user);
        return { accessToken, refreshToken: newRefreshToken };
      },
      () => {
        resetRefreshState();
        cancelAllRequests();
        useAuthStore.getState().logout();
      },
      () => {
        // Prevent global redirect on 403 Forbidden to allow graceful component-level error handling
      },
    ),
  );

  clientInstance = client;
  return client;
}

export const apiClient = createApiClient();

let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

export function startCleanupScheduler(intervalMs: number = 60000): void {
  if (cleanupIntervalId) return;
  cleanupIntervalId = setInterval(() => {
    const cleaned = cleanupStaleRequests();
    if (cleaned > 0) {
      apiLogger.debug(`Cleaned up ${cleaned} stale requests`);
    }
  }, intervalMs);
}

export function stopCleanupScheduler(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}

export function createCancelToken(): CancelTokenSource {
  return axios.CancelToken.source();
}

export function isCancel(error: unknown): boolean {
  return axios.isCancel(error);
}

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

export async function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}

export function createAbortController(): AbortController {
  return new AbortController();
}

export function withSignal(config: AxiosRequestConfig, signal: AbortSignal): AxiosRequestConfig {
  return { ...config, signal };
}
