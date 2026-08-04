import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { indentService } from '../services/indent.service';
import { IndentStatus, type Indent } from '../types/indent';

export const indentKeys = {
  all: ['indents'] as const,
  lists: () => [...indentKeys.all, 'list'] as const,
  list: (filters: string) => [...indentKeys.lists(), { filters }] as const,
  details: () => [...indentKeys.all, 'detail'] as const,
  detail: (id: string) => [...indentKeys.details(), id] as const,
};

export const useIndents = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: indentKeys.list(JSON.stringify(filters || {})),
    queryFn: () => indentService.getAll(filters),
  });
};

export const useIndent = (id: string) => {
  return useQuery({
    queryKey: indentKeys.detail(id),
    queryFn: () => indentService.getById(id),
    enabled: !!id,
  });
};

export const useCreateIndent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newIndent: Partial<Indent>) => indentService.create(newIndent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indentKeys.lists() });
    },
  });
};

export const useUpdateIndent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Indent> }) =>
      indentService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: indentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: indentKeys.lists() });
    },
  });
};

export const useUpdateIndentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: IndentStatus }) =>
      indentService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: indentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: indentKeys.lists() });
    },
  });
};

export const useDeleteIndent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => indentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indentKeys.lists() });
    },
  });
};
