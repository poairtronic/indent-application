import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessTransactionService } from '../services/business-transaction.service';

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
    queryFn: () => businessTransactionService.getAll(filters),
  });
};

export const useIndent = (id: string) => {
  return useQuery({
    queryKey: indentKeys.detail(id),
    queryFn: () => businessTransactionService.getById(id),
    enabled: !!id,
  });
};

export const useCreateIndent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { indent: any; costSheet: any }) =>
      businessTransactionService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indentKeys.lists() });
    },
  });
};

export const useUpdateIndent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { indent?: any; costSheet?: any } }) =>
      businessTransactionService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: indentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: indentKeys.lists() });
    },
  });
};

export const useSubmitDesign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      businessTransactionService.submitDesign(id, remarks),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: indentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: indentKeys.lists() });
    },
  });
};

export const useEnterActualCosts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) =>
      businessTransactionService.enterActualCosts(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: indentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: indentKeys.lists() });
    },
  });
};

export const useFinancialClose = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) =>
      businessTransactionService.financialClose(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: indentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: indentKeys.lists() });
    },
  });
};
