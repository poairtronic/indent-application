import type { AxiosRequestConfig } from 'axios';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
  skipTransform?: boolean;
  metadata?: RequestMetadata;
}

export interface RequestMetadata {
  requestId?: string;
  module?: string;
  action?: string;
  startTime?: number;
}

export interface ClientConfig {
  baseURL: string;
  timeout: number;
  version: string;
  environment: 'development' | 'testing' | 'production';
}
