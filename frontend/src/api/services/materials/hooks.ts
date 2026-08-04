import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { materialService } from './service';
import type {
  MaterialResponse,
  MaterialQueryParams,
  CreateMaterialPayload,
  UpdateMaterialPayload,
} from '../../types/material';

export function useMaterials(params: MaterialQueryParams) {
  return useQuery({
    queryKey: [...queryKeys.materials.list('materials'), params],
    queryFn: () => materialService.list(params),
  });
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: queryKeys.materials.detail('materials', id),
    queryFn: () => materialService.getById<MaterialResponse>(id),
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaterialPayload) =>
      materialService.create<MaterialResponse>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.list('materials') });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMaterialPayload }) =>
      materialService.update<MaterialResponse>(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.list('materials') });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => materialService.remove<void>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.list('materials') });
    },
  });
}

export function useRestoreMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => materialService.restore<MaterialResponse>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.list('materials') });
    },
  });
}
