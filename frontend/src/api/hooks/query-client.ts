import { QueryClient } from '@tanstack/react-query';
import { RETRY } from '../constants';
import { ApiError } from '../errors';
import { isCancel } from '../client';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: (failureCount, error) => {
          if (isCancel(error)) return false;
          if (error instanceof ApiError) {
            if (error.isAuthError || error.isForbidden) return false;
            if (error.status === 404) return false;
            if (error.isValidationError) return false;
          }
          return failureCount < RETRY.MAX_RETRIES;
        },
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
