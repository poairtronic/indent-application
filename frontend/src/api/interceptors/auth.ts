import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../store/authStore';

export function createAuthInterceptor() {
  return (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (config.skipAuth) return config;

    const { accessToken, isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated || !accessToken) return config;

    // Attach the token even if it may be expired.
    // The backend will return 401 if truly expired, and the error interceptor
    // will handle token refresh + request retry. Previously, we proactively
    // logged out here which prevented the refresh mechanism from ever running.
    if (config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  };
}
