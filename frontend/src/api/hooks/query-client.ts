import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../errors';
import { isCancel } from '../client';

const MAX_NETWORK_RETRIES = 1;
const MAX_SERVER_RETRIES = 2;
const MAX_DEFAULT_RETRIES = 1;

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isCancel(error)) return false;

  if (error instanceof ApiError) {
    // 401 is handled by the auth-refresh flow in the axios error interceptor,
    // never retried blindly by the query layer.
    if (error.isAuthError || error.isForbidden) return false;

    // 4xx errors are deterministic - retrying cannot change the outcome.
    if (
      error.status === 400 ||
      error.status === 403 ||
      error.status === 404 ||
      error.status === 409 ||
      error.status === 422 ||
      error.status === 429 ||
      error.isValidationError
    ) {
      return false;
    }

    // Transient connection/timeout problems get a small bounded retry.
    if (error.isNetworkError || error.isTimeout || error.status === 0) {
      return failureCount < MAX_NETWORK_RETRIES;
    }

    // 5xx errors may be transient, retry briefly.
    if (error.isServerError) {
      return failureCount < MAX_SERVER_RETRIES;
    }

    return failureCount < MAX_DEFAULT_RETRIES;
  }

  // Non-ApiError failures (unexpected) - bounded retry as a safety net.
  return failureCount < MAX_NETWORK_RETRIES;
}

function getRetryDelay(failureCount: number): number {
  return Math.min(1000 * 2 ** (failureCount - 1), 8000);
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: shouldRetryQuery,
        retryDelay: getRetryDelay,
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        throwOnError: false,
      },
      mutations: {
        retry: false,
        throwOnError: false,
      },
    },
  });
}
