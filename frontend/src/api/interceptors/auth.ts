import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../store/authStore';

export function createAuthInterceptor() {
  return (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (config.skipAuth) return config;

    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  };
}
