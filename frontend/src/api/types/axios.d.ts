import 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
    skipErrorHandling?: boolean;
    skipTransform?: boolean;
    metadata?: {
      requestId?: string;
      module?: string;
      action?: string;
      startTime?: number;
    };
  }

  interface InternalAxiosRequestConfig {
    skipAuth?: boolean;
    skipErrorHandling?: boolean;
    skipTransform?: boolean;
    metadata?: {
      requestId?: string;
      module?: string;
      action?: string;
      startTime?: number;
    };
  }
}
