import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { processService } from './service';
import type {
  ProcessResponse,
  ProcessQueryParams,
  CreateProcessPayload,
  UpdateProcessPayload,
} from '../../../types/process';
import { useAuthStore } from '../../../store/authStore';
import { AppPermission } from '../../../constants/permissions';

export function useProcesses(params: ProcessQueryParams, options?: { enabled?: boolean }) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canView = hasPermission(AppPermission.PROCESSES_VIEW);

  return useQuery({
    queryKey: [...queryKeys.processes.list('processes'), params],
    queryFn: () => processService.list(params),
    enabled: (options?.enabled !== false) && canView,
  });
}

export function useProcess(id: string) {
  return useQuery({
    queryKey: queryKeys.processes.detail('processes', id),
    queryFn: () => processService.getById<ProcessResponse>(id),
  });
}

export function useCreateProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProcessPayload) => processService.create<ProcessResponse>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processes.list('processes') });
    },
  });
}

export function useUpdateProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProcessPayload }) =>
      processService.update<ProcessResponse>(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processes.list('processes') });
    },
  });
}

export function useDeleteProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => processService.remove<{ message: string }>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processes.list('processes') });
    },
  });
}

export function useRestoreProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => processService.restore<ProcessResponse>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processes.list('processes') });
    },
  });
}
