import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vendorService } from '../services/vendor.service';
import type { CreateVendorPayload, UpdateVendorPayload, VendorQueryParams } from '../types/vendor';

export const VENDORS_KEY = ['vendors'];

export function useVendors(params: VendorQueryParams) {
  return useQuery({
    queryKey: [...VENDORS_KEY, params],
    queryFn: () => vendorService.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useVendor(id: string | null) {
  return useQuery({
    queryKey: [...VENDORS_KEY, 'detail', id],
    queryFn: () => vendorService.getById(id as string),
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVendorPayload) => vendorService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDORS_KEY });
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVendorPayload }) =>
      vendorService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDORS_KEY });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDORS_KEY });
    },
  });
}

export function useRestoreVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorService.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDORS_KEY });
    },
  });
}
