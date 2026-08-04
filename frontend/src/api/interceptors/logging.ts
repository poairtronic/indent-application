import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

let requestIdCounter = 0;

export function createRequestLogger(enableLogging: boolean) {
  return (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (!enableLogging) return config;

    const requestId = `req_${++requestIdCounter}_${Date.now()}`;
    config.metadata = { requestId, startTime: Date.now() };

    console.info(
      `[API] ${config.method?.toUpperCase()} ${config.url}`,
      config.params ? { params: config.params } : '',
    );

    return config;
  };
}

export function createResponseLogger(enableLogging: boolean) {
  return (response: AxiosResponse): AxiosResponse => {
    if (!enableLogging) return response;

    const duration = response.config.metadata?.startTime
      ? Date.now() - response.config.metadata.startTime
      : 0;

    console.info(
      `[API] ${response.config.method?.toUpperCase()} ${response.config.url}`,
      `-> ${response.status}`,
      `${duration}ms`,
    );

    return response;
  };
}
