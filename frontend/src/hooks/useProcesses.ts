import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { processService } from '../services/process.service';
import type {
  CreateProcessPayload,
  ProcessQueryParams,
  UpdateProcessPayload,
} from '../types/process';

export const PROCESSES_KEY = ['processes'];

export function useProcesses(params: ProcessQueryParams) {
  return useQuery({
    queryKey: [...PROCESSES_KEY, params],
    queryFn: () => processService.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useProcess(id: string | null) {
  return useQuery({
    queryKey: [...PROCESSES_KEY, 'detail', id],
    queryFn: () => processService.getById(id as string),
    enabled: !!id,
  });
}

export function useCreateProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProcessPayload) => processService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROCESSES_KEY });
    },
  });
}

export function useUpdateProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProcessPayload }) =>
      processService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROCESSES_KEY });
    },
  });
}

export function useDeleteProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => processService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROCESSES_KEY });
    },
  });
}

export function useRestoreProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => processService.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROCESSES_KEY });
    },
  });
}
