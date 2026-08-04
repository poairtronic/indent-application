import type { AxiosRequestConfig } from 'axios';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestMetadata {
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

export interface RequestConfig extends Omit<AxiosRequestConfig, 'metadata'> {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
  skipTransform?: boolean;
  skipRetry?: boolean;
  metadata?: RequestMetadata;
}

export interface ClientConfig {
  baseURL: string;
  timeout: number;
  version: string;
  environment: 'development' | 'testing' | 'production';
}
