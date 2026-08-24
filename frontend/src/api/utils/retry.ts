import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffFactor: number;
  retryOn: number[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffFactor: 2,
  retryOn: [408, 429, 500, 502, 503, 504],
};

const NON_RETRYABLE_STATUS = new Set([400, 401, 403, 404, 405, 409, 422, 451]);

export function shouldRetry(error: AxiosError, attempt: number, config: RetryConfig): boolean {
  if (attempt >= config.maxRetries) return false;

  if (!error.response && !error.code) return true;

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return true;

  if (error.code === 'ERR_NETWORK') return true;

  const status = error.response?.status;
  // Authentication attempts must never be retried automatically: retrying a
  // 429 multiplies failed login requests and extends the lockout window.
  if (status === 429 && error.config?.url?.includes('/auth/')) return false;
  if (status && NON_RETRYABLE_STATUS.has(status)) return false;

  if (status && config.retryOn.includes(status)) return true;

  if (!error.response) return true;

  return false;
}

export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig,
  retryAfterHeader?: string | null,
): number {
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 30000);
    }
  }

  const baseDelay = config.retryDelay * Math.pow(config.backoffFactor, attempt);
  const jitter = baseDelay * 0.2 * (Math.random() * 2 - 1);
  return Math.min(baseDelay + jitter, 30000);
}

export function getRetryAttempt(config: InternalAxiosRequestConfig): number {
  return config.metadata?.attempt ?? 0;
}

export function incrementRetryAttempt(config: InternalAxiosRequestConfig): void {
  if (!config.metadata) {
    config.metadata = {
      requestId: '',
      correlationId: '',
      startTime: Date.now(),
      clientVersion: '',
      appName: '',
      timezone: '',
      locale: '',
    };
  }
  config.metadata.attempt = (config.metadata.attempt ?? 0) + 1;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
