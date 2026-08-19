import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { roleService } from './service';
import type { RoleResponse, CreateRolePayload, UpdateRolePayload } from '../../../types/user';

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.roles.list('roles'),
    queryFn: () => roleService.list(),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: queryKeys.roles.detail('roles', id),
    queryFn: () => roleService.getById<RoleResponse>(id),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => roleService.create<RoleResponse>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.list('roles') });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      roleService.update<RoleResponse>(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.list('roles') });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roleService.remove<void>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.list('roles') });
    },
  });
}

export function useRolePermissions(id: string) {
  return useQuery({
    queryKey: queryKeys.roles.detail('roles', id),
    queryFn: () => roleService.getPermissions(id),
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissionIds }: { id: string; permissionIds: string[] }) =>
      roleService.updatePermissions(id, permissionIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.detail('roles', variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.list('roles') });
    },
  });
}
