import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type {
  UseQueryOptions,
  UseQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { ApiResponse, PaginatedData } from '../types/api-response';
import { ApiError } from '../errors';
import { isCancel } from '../client';
import { invalidateModule, invalidateDetail } from './invalidate';

type QueryKey = readonly unknown[];

interface UseApiQueryOptions<TData, TError = ApiError> extends Omit<
  UseQueryOptions<ApiResponse<TData>, TError>,
  'queryKey' | 'queryFn'
> {
  queryKey: QueryKey;
  queryFn: () => Promise<ApiResponse<TData>>;
}

export function useApiQuery<TData, TError = ApiError>(
  options: UseApiQueryOptions<TData, TError>,
): UseQueryResult<ApiResponse<TData>, TError> {
  return useQuery({
    ...options,
  });
}

interface UseApiListQueryOptions<TData, TError = ApiError> extends Omit<
  UseQueryOptions<ApiResponse<PaginatedData<TData>>, TError>,
  'queryKey' | 'queryFn'
> {
  queryKey: QueryKey;
  queryFn: () => Promise<ApiResponse<PaginatedData<TData>>>;
}

export function useApiListQuery<TData, TError = ApiError>(
  options: UseApiListQueryOptions<TData, TError>,
): UseQueryResult<ApiResponse<PaginatedData<TData>>, TError> {
  return useQuery({
    ...options,
  });
}

interface UseApiMutationOptions<TData, TVariables, TError = ApiError> extends Omit<
  UseMutationOptions<ApiResponse<TData>, TError, TVariables>,
  'mutationFn'
> {
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>;
  invalidateQueries?: QueryKey[];
}

export function useApiMutation<TData, TVariables, TError = ApiError>(
  options: UseApiMutationOptions<TData, TVariables, TError>,
): UseMutationResult<ApiResponse<TData>, TError, TVariables> {
  const queryClient = useQueryClient();
  const { invalidateQueries, ...mutationOptions } = options;

  return useMutation({
    ...mutationOptions,
    onSuccess: (...args) => {
      if (invalidateQueries) {
        for (const key of invalidateQueries) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      mutationOptions.onSuccess?.(...args);
    },
  });
}

interface UseApiInfiniteQueryOptions<TData, TError = ApiError> extends Omit<
  UseInfiniteQueryOptions<ApiResponse<TData>, TError, ApiResponse<TData>>,
  'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
> {
  queryKey: QueryKey;
  queryFn: (context: { pageParam: unknown }) => Promise<ApiResponse<TData>>;
  getNextPageParam: (lastPage: ApiResponse<TData>, allPages: ApiResponse<TData>[]) => unknown;
}

export function useApiInfiniteQuery<TData, TError = ApiError>(
  options: UseApiInfiniteQueryOptions<TData, TError>,
): UseInfiniteQueryResult<ApiResponse<TData>, TError> {
  return useInfiniteQuery({
    ...options,
    initialPageParam: 1,
  });
}

export function getQueryErrorMessage(error: unknown): string {
  if (isCancel(error)) return 'Request was cancelled';
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError) return error.getFieldErrors();
  return {};
}

export function useInvalidateModule(module: string) {
  const queryClient = useQueryClient();
  return () => invalidateModule(queryClient, module);
}

export function useInvalidateDetail(module: string, id: string) {
  const queryClient = useQueryClient();
  return () => invalidateDetail(queryClient, module, id);
}
