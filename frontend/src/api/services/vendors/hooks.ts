import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { vendorService } from './service';
import type {
  VendorResponse,
  VendorQueryParams,
  CreateVendorPayload,
  UpdateVendorPayload,
} from '../../../types/vendor';

export function useVendors(params: VendorQueryParams, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.vendors.list('vendors'), params],
    queryFn: () => vendorService.list(params),
    enabled,
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: queryKeys.vendors.detail('vendors', id),
    queryFn: () => vendorService.getById<VendorResponse>(id),
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVendorPayload) => vendorService.create<VendorResponse>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.list('vendors') });
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVendorPayload }) =>
      vendorService.update<VendorResponse>(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.list('vendors') });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorService.remove<{ message: string }>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.list('vendors') });
    },
  });
}

export function useRestoreVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorService.restore<VendorResponse>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.list('vendors') });
    },
  });
}

export function useBulkDeleteVendors() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => vendorService.bulkRemove(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.list('vendors') });
    },
  });
}

export function useBulkRestoreVendors() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => vendorService.bulkRestore(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.list('vendors') });
    },
  });
}
