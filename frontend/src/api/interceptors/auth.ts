import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../store/authStore';

export function createAuthInterceptor() {
  return (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (config.skipAuth) return config;

    const { accessToken, isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated || !accessToken) return config;

    if (isTokenExpired(accessToken)) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return config;
    }

    if (config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  };
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp !== undefined && payload.exp < currentTime;
  } catch {
    return false;
  }
}
