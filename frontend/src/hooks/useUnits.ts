import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unitService } from '../services/unit.service';
import type { CreateUnitPayload, UnitQueryParams, UpdateUnitPayload } from '../types/unit';

export const UNITS_KEY = ['units'];

export function useUnits(params: UnitQueryParams) {
  return useQuery({
    queryKey: [...UNITS_KEY, params],
    queryFn: () => unitService.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useUnit(id: string | null) {
  return useQuery({
    queryKey: [...UNITS_KEY, 'detail', id],
    queryFn: () => unitService.getById(id as string),
    enabled: !!id,
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUnitPayload) => unitService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNITS_KEY });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUnitPayload }) =>
      unitService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNITS_KEY });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unitService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNITS_KEY });
    },
  });
}

export function useRestoreUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unitService.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNITS_KEY });
    },
  });
}
