import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { costSheetService } from './service';
import type { CostSheet } from '../../../types/costing';

export function useCostSheet(id: string) {
  return useQuery({
    queryKey: queryKeys.costSheets.detail('cost-sheets', id),
    queryFn: () => costSheetService.getById<CostSheet>(id),
  });
}

export function useCostSheetByIndent(indentId: string) {
  return useQuery({
    queryKey: queryKeys.costSheets.detail('cost-sheets', indentId),
    queryFn: () => costSheetService.getByIndent(indentId),
  });
}

export function useUpdateCostSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      costSheetService.update<CostSheet>(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.costSheets.list('cost-sheets') });
    },
  });
}

export function useEstimation(indentId: string) {
  return useQuery({
    queryKey: queryKeys.costSheets.detail('cost-sheets', indentId),
    queryFn: () => costSheetService.getEstimation(indentId),
  });
}

export function useUpdateEstimation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ indentId, data }: { indentId: string; data: Record<string, unknown> }) =>
      costSheetService.updateEstimation(indentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.costSheets.list('cost-sheets') });
    },
  });
}
