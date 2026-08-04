import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { indentService } from './service';
import type {
  IndentData,
  IndentQueryParams,
  CreateIndentPayload,
  UpdateIndentPayload,
} from './service';

export function useIndents(params: IndentQueryParams) {
  return useQuery({
    queryKey: [...queryKeys.indents.list('indents'), params],
    queryFn: () => indentService.list(params),
  });
}

export function useIndent(id: string) {
  return useQuery({
    queryKey: queryKeys.indents.detail('indents', id),
    queryFn: () => indentService.getById<IndentData>(id),
  });
}

export function useCreateIndent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIndentPayload) => indentService.create<IndentData>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.indents.list('indents') });
    },
  });
}

export function useUpdateIndent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateIndentPayload }) =>
      indentService.update<IndentData>(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.indents.list('indents') });
    },
  });
}

export function useSubmitIndent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      indentService.submit(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.indents.list('indents') });
    },
  });
}

export function useVerifyStores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => indentService.verifyStores(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.indents.list('indents') });
    },
  });
}

export function useIssueStores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: Record<string, unknown> }) =>
      indentService.issueStores(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.indents.list('indents') });
    },
  });
}

export function useVerifyAccounts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      indentService.verifyAccounts(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.indents.list('indents') });
    },
  });
}

export function useEnterActualCosts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      indentService.enterActualCosts(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.indents.list('indents') });
    },
  });
}

export function useFinancialClose() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: Record<string, unknown> }) =>
      indentService.financialClose(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.indents.list('indents') });
    },
  });
}

export function useArchiveIndent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      indentService.archive(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.indents.list('indents') });
    },
  });
}
