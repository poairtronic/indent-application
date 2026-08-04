import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { userService } from './service';
import type {
  UserResponse,
  UserQueryParams,
  CreateUserPayload,
  UpdateUserPayload,
  UserStatus,
} from '../../../types/user';

export function useUsers(params: UserQueryParams) {
  return useQuery({
    queryKey: [...queryKeys.users.list('users'), params],
    queryFn: () => userService.list(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail('users', id),
    queryFn: () => userService.getById<UserResponse>(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.create<UserResponse>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list('users') });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      userService.update<UserResponse>(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list('users') });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      userService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list('users') });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.remove<{ message: string }>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list('users') });
    },
  });
}

export function useRestoreUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.restore<UserResponse>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list('users') });
    },
  });
}

export function useBulkDeleteUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => userService.bulkRemove(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list('users') });
    },
  });
}

export function useBulkRestoreUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => userService.bulkRestore(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list('users') });
    },
  });
}

export function useUserRoles() {
  return useQuery({
    queryKey: queryKeys.users.list('roles'),
    queryFn: () => userService.listRoles(),
  });
}

export function useUserDepartments() {
  return useQuery({
    queryKey: queryKeys.users.list('departments'),
    queryFn: () => userService.listDepartments(),
  });
}
