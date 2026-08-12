import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { unitService } from './service';
import type {
  UnitResponse,
  UnitQueryParams,
  CreateUnitPayload,
  UpdateUnitPayload,
} from '../../../types/unit';
import { useAuthStore } from '../../../store/authStore';
import { AppPermission } from '../../../constants/permissions';

export function useUnits(params: UnitQueryParams, options?: { enabled?: boolean }) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canView = hasPermission(AppPermission.UNITS_VIEW);

  return useQuery({
    queryKey: [...queryKeys.units.list('units'), params],
    queryFn: () => unitService.list(params),
    enabled: (options?.enabled !== false) && canView,
  });
}

export function useUnit(id: string) {
  return useQuery({
    queryKey: queryKeys.units.detail('units', id),
    queryFn: () => unitService.getById<UnitResponse>(id),
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUnitPayload) => unitService.create<UnitResponse>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.units.list('units') });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUnitPayload }) =>
      unitService.update<UnitResponse>(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.units.list('units') });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unitService.remove<{ message: string }>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.units.list('units') });
    },
  });
}

export function useRestoreUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unitService.restore<UnitResponse>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.units.list('units') });
    },
  });
}
