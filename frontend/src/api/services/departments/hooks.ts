import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { departmentService } from './service';
import type {
  DepartmentResponse,
  DepartmentQueryParams,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from '../../types/department';

export function useDepartments(params?: DepartmentQueryParams) {
  return useQuery({
    queryKey: [...queryKeys.departments.list('departments'), params],
    queryFn: () => departmentService.list(params ?? {}),
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: queryKeys.departments.detail('departments', id),
    queryFn: () => departmentService.getById<DepartmentResponse>(id),
  });
}

export function useDepartmentOptions() {
  return useQuery({
    queryKey: queryKeys.departments.list('departments'),
    queryFn: () => departmentService.getOptions(),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) =>
      departmentService.create<DepartmentResponse>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.list('departments') });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDepartmentPayload }) =>
      departmentService.update<DepartmentResponse>(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.list('departments') });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentService.remove<void>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.list('departments') });
    },
  });
}

export function useRestoreDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentService.restore<DepartmentResponse>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.list('departments') });
    },
  });
}
