import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { businessTransactionService } from './service';
import type { BusinessTransactionData } from './service';

export function useBusinessTransactions(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...queryKeys.businessTransactions.list('business-transactions'), params],
    queryFn: () => businessTransactionService.list(params),
  });
}

export function useBusinessTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.businessTransactions.detail('business-transactions', id),
    queryFn: () => businessTransactionService.getById<BusinessTransactionData>(id),
  });
}

export function useSubmitTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      businessTransactionService.submit(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.businessTransactions.list('business-transactions'),
      });
    },
  });
}

export function useVerifyStoresTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => businessTransactionService.verifyStores(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.businessTransactions.list('business-transactions'),
      });
    },
  });
}

export function useIssueStoresTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: Record<string, unknown> }) =>
      businessTransactionService.issueStores(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.businessTransactions.list('business-transactions'),
      });
    },
  });
}

export function useVerifyAccountsTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      businessTransactionService.verifyAccounts(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.businessTransactions.list('business-transactions'),
      });
    },
  });
}

export function useEnterActualCostsTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      businessTransactionService.enterActualCosts(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.businessTransactions.list('business-transactions'),
      });
    },
  });
}

export function useFinancialCloseTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: Record<string, unknown> }) =>
      businessTransactionService.financialClose(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.businessTransactions.list('business-transactions'),
      });
    },
  });
}
