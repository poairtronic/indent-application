import type { QueryClient } from '@tanstack/react-query';

export function invalidateModule(queryClient: QueryClient, module: string): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: ['api', 'list', module],
  });
}

export function invalidateDetail(
  queryClient: QueryClient,
  module: string,
  id: string,
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: ['api', 'detail', module, id],
  });
}

export function invalidateAll(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: ['api'],
  });
}
