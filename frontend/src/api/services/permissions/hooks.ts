import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { permissionService } from './service';
import type {
  PermissionResponse,
  CreatePermissionPayload,
  UpdatePermissionPayload,
} from './service';

export function usePermissions(module?: string) {
  return useQuery({
    queryKey: [...queryKeys.permissions.list('permissions'), module],
    queryFn: () => permissionService.list(module),
  });
}

export function usePermissionModules() {
  return useQuery({
    queryKey: queryKeys.permissions.list('permissions'),
    queryFn: () => permissionService.getModules(),
  });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePermissionPayload) =>
      permissionService.create<PermissionResponse>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.list('permissions') });
    },
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePermissionPayload }) =>
      permissionService.update<PermissionResponse>(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.list('permissions') });
    },
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => permissionService.remove<void>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.list('permissions') });
    },
  });
}

export type { PermissionResponse, CreatePermissionPayload, UpdatePermissionPayload };
