import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { indentService } from './service';
import type {
  IndentData,
  IndentQueryParams,
  CreateIndentPayload,
  UpdateIndentPayload,
} from './service';

function invalidateIndent(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.indents.list('indents') });
  if (id) {
    queryClient.invalidateQueries({ queryKey: queryKeys.indents.detail('indents', id) });
  }
}

export function useIndents(params: IndentQueryParams) {
  return useQuery({
    queryKey: [...queryKeys.indents.list('indents'), params],
    queryFn: () => indentService.list(params),
  });
}

export function useIndent(id: string) {
  return useQuery({
    queryKey: queryKeys.indents.detail('indents', id),
    queryFn: () => indentService.getDetail(id),
    enabled: Boolean(id),
  });
}

export interface CreateTransactionResponse {
  id: string;
  success: boolean;
}

export function useCreateIndent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIndentPayload) => indentService.create<CreateTransactionResponse>(payload),
    onSuccess: () => {
      invalidateIndent(queryClient);
    },
  });
}

export function useUpdateIndent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateIndentPayload }) =>
      indentService.update<IndentData>(id, payload),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useSubmitIndent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      indentService.submit(id, remarks),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useVerifyStores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => indentService.verifyStores(id),
    onSuccess: (_data, id) => {
      invalidateIndent(queryClient, id);
    },
  });
}

export function useIssueStores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: Record<string, unknown> }) =>
      indentService.issueStores(id, data),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useIssueMaterialItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, itemId }: { id: string; itemId: string }) =>
      indentService.issueItem(id, itemId),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useReceiveProduction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      indentService.receiveProduction(id, remarks),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useStartProduction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      indentService.startProduction(id, remarks),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      indentService.updateProgress(id, data),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useCompleteProduction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      indentService.completeProduction(id, remarks),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useDeliverCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      indentService.deliverCustomer(id, data),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useVerifyAccounts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      indentService.verifyAccounts(id, remarks),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useEnterActualCosts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      indentService.enterActualCosts(id, data),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useUpdateMaterialCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      indentService.updateMaterialCost(id, data),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useFinancialClose() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: Record<string, unknown> }) =>
      indentService.financialClose(id, data),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useArchiveIndent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      indentService.archive(id, remarks),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useCompleteIndent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      indentService.complete(id, remarks),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      file,
      remarks,
      onProgress,
    }: {
      id: string;
      file: File;
      remarks?: string;
      onProgress?: (progress: number) => void;
    }) => indentService.uploadAttachment(id, file, remarks, onProgress),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}

export function useDownloadAttachment() {
  return useMutation({
    mutationFn: (fileName: string) => indentService.downloadAttachment(fileName),
  });
}

export function useAttachmentSummary(id: string) {
  return useQuery({
    queryKey: [...queryKeys.indents.detail('indents', id), 'attachments', 'summary'],
    queryFn: () => indentService.getAttachmentSummary(id),
    enabled: Boolean(id),
  });
}

export function useRemoveAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      indentService.removeAttachment(id, attachmentId),
    onSuccess: (_data, variables) => {
      invalidateIndent(queryClient, variables.id);
    },
  });
}
