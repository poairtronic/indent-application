import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, CancelTokenSource } from 'axios';
import { apiConfig, featureFlags } from '../config';
import { TIMEOUTS } from '../constants';
import { createAuthInterceptor } from '../interceptors/auth';
import { createRequestLogger, createResponseLogger } from '../interceptors/logging';
import { createErrorInterceptor } from '../interceptors/error';
import { useAuthStore } from '../../store/authStore';

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

  client.interceptors.request.use(createAuthInterceptor());
  client.interceptors.request.use(createRequestLogger(featureFlags.enableRequestLogging));
  client.interceptors.response.use(createResponseLogger(featureFlags.enableResponseLogging));

  client.interceptors.response.use(
    (response) => response,
    createErrorInterceptor(
      async (refreshToken: string) => {
        const response = await axios.post(`${apiConfig.baseURL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken, user } = response.data.data;
        useAuthStore.getState().login(accessToken, newRefreshToken, user);
        return { accessToken, refreshToken: newRefreshToken };
      },
      () => {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      },
      () => {
        window.location.href = '/unauthorized';
      },
    ),
  );

  clientInstance = client;
  return client;
}

export const apiClient = createApiClient();

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
