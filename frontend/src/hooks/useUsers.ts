import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import type {
  CreateUserPayload,
  DepartmentOption,
  UpdateUserPayload,
  UserQueryParams,
  UserStatus,
} from '../types/user';

export const USERS_KEY = ['users'];
export const ROLES_KEY = ['roles'];

export function useUsers(params: UserQueryParams) {
  return useQuery({
    queryKey: [...USERS_KEY, params],
    queryFn: () => userService.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: [...USERS_KEY, 'detail', id],
    queryFn: () => userService.getById(id as string),
    enabled: !!id,
  });
}

export function useUserProfile() {
  return useQuery({
    queryKey: [...USERS_KEY, 'profile'],
    queryFn: () => userService.getProfile(),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ROLES_KEY,
    queryFn: () => userService.listRoles(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartmentOptions() {
  const profileQuery = useUserProfile();
  const sourceQuery = useQuery({
    queryKey: [...USERS_KEY, 'department-source'],
    queryFn: () => userService.list({ page: 1, limit: 100 }),
  });

  const options = useMemo<DepartmentOption[]>(() => {
    const map = new Map<string, DepartmentOption>();

    if (profileQuery.data?.departmentId && profileQuery.data?.departmentName) {
      map.set(profileQuery.data.departmentId, {
        id: profileQuery.data.departmentId,
        name: profileQuery.data.departmentName,
      });
    }

    sourceQuery.data?.items.forEach((user) => {
      if (user.departmentId && user.departmentName) {
        map.set(user.departmentId, { id: user.departmentId, name: user.departmentName });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [profileQuery.data, sourceQuery.data]);

  return {
    options,
    isLoading: profileQuery.isLoading || sourceQuery.isLoading,
  };
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      userService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      userService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useRestoreUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}
