import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { productService } from './service';
import type {
  ProductResponse,
  ProductQueryParams,
  CreateProductPayload,
  UpdateProductPayload,
} from '../../types/product';

export function useProducts(params: ProductQueryParams) {
  return useQuery({
    queryKey: [...queryKeys.products.list('products'), params],
    queryFn: () => productService.list(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail('products', id),
    queryFn: () => productService.getById<ProductResponse>(id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => productService.create<ProductResponse>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.list('products') });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
      productService.update<ProductResponse>(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.list('products') });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productService.remove<void>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.list('products') });
    },
  });
}

export function useRestoreProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productService.restore<ProductResponse>(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.list('products') });
    },
  });
}
