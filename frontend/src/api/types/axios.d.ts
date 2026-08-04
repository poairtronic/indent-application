import 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
    skipErrorHandling?: boolean;
    skipTransform?: boolean;
    skipRetry?: boolean;
    metadata?: RequestMetadata;
    retry?: RetryConfig;
  }

  interface InternalAxiosRequestConfig {
    skipAuth?: boolean;
    skipErrorHandling?: boolean;
    skipTransform?: boolean;
    skipRetry?: boolean;
    metadata?: RequestMetadata;
    retry?: RetryConfig;
  }

  interface RequestMetadata {
    requestId: string;
    correlationId: string;
    module?: string;
    action?: string;
    startTime: number;
    clientVersion: string;
    appName: string;
    timezone: string;
    locale: string;
    attempt?: number;
  }

  interface RetryConfig {
    maxRetries: number;
    retryDelay: number;
    backoffFactor: number;
    retryOn: number[];
  }
}
