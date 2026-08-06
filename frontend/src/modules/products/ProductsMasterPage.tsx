import React, { useState, useCallback, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Download,
  Archive,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { KPICard } from '../../components/ui/Cards';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Pagination } from '../../components/ui/Pagination';
import { ToastViewport, useToasts } from '../../components/ui/toast';
import { ProductFormModal } from './ProductFormModal';
import type { ProductData } from './ProductFormModal';
import { ProductDetailModal } from './ProductDetailModal';
import { downloadFile } from '../../utils/download';
import { useAuthStore } from '../../store/authStore';
import { AppPermission } from '../../constants/permissions';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../../api/services/products/hooks';
import type {
  ProductResponse,
  CreateProductPayload,
  UpdateProductPayload,
} from '../../api/types/product';

const PAGE_SIZE = 10;

const responseToProductData = (item: ProductResponse): ProductData => ({
  id: item.id,
  productCode: item.productCode,
  productName: item.productName,
  description: item.description ?? undefined,
  category: item.departmentName ?? '',
  unitOfMeasure: '',
  estimatedCost: 0,
  isActive: item.status === 'ACTIVE',
});

export const ProductsMasterPage: React.FC = () => {
  const { toasts, show, dismiss } = useToasts();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [detailProduct, setDetailProduct] = useState<ProductData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductData | null>(null);

  const canCreate = hasPermission(AppPermission.PRODUCTS_CREATE);
  const canUpdate = hasPermission(AppPermission.PRODUCTS_UPDATE);
  const canExport = hasPermission(AppPermission.REPORTS_EXPORT);

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      status: statusFilter !== 'ALL' ? (statusFilter as 'ACTIVE' | 'INACTIVE') : undefined,
    }),
    [page, search, statusFilter],
  );

  const { data: paginatedData, isLoading, error, refetch } = useProducts(queryParams);
  const products = useMemo(() => paginatedData?.items ?? [], [paginatedData]);
  const total = paginatedData?.total ?? 0;
  const totalPages = paginatedData?.totalPages ?? 1;

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const resetPage = useCallback(() => setPage(1), []);

  const handleSaveProduct = useCallback(
    async (productData: ProductData) => {
      if (productData.id) {
        const payload: UpdateProductPayload = {
          productCode: productData.productCode,
          productName: productData.productName,
          description: productData.description,
        };
        await updateProduct.mutateAsync({ id: productData.id, payload });
        show('success', `Product "${productData.productName}" updated successfully.`);
      } else {
        const payload: CreateProductPayload = {
          productCode: productData.productCode,
          productName: productData.productName,
          description: productData.description,
        };
        await createProduct.mutateAsync(payload);
        show('success', `Product "${productData.productName}" created successfully.`);
        resetPage();
      }
    },
    [createProduct, updateProduct, show, resetPage],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget?.id) {
      await deleteProduct.mutateAsync(deleteTarget.id);
      show('success', `Product "${deleteTarget.productName}" deleted.`);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteProduct, show]);

  const handleToggleArchive = useCallback(
    async (id: string) => {
      const product = products.find((p) => p.id === id);
      if (!product) return;
      const payload: UpdateProductPayload = {
        status: product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      };
      await updateProduct.mutateAsync({ id, payload });
      show(
        'success',
        `Product "${product.productName}" ${product.status === 'ACTIVE' ? 'deactivated' : 'activated'}.`,
      );
    },
    [products, updateProduct, show],
  );

  const handleExportCSV = useCallback(() => {
    const headers = ['Product Code', 'Product Name', 'Description', 'Status'];
    const rows = products.map((p) => [
      p.productCode,
      `"${p.productName.replace(/"/g, '""')}"`,
      `"${(p.description ?? '').replace(/"/g, '""')}"`,
      p.status,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csvContent, 'products_master.csv', 'text/csv');
  }, [products]);

  const activeCount = useMemo(
    () => products.filter((p) => p.status === 'ACTIVE').length,
    [products],
  );
  const archivedCount = useMemo(
    () => products.filter((p) => p.status !== 'ACTIVE').length,
    [products],
  );

  if (error) {
    return (
      <div className="space-y-6 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight">
              Products Master Catalog
            </h1>
            <p className="text-xs text-text-muted">
              Manage manufactured products, SKUs, cost estimations, and CAD technical parameters
            </p>
          </div>
        </div>
        <div className="bg-surface-card border border-status-error/30 rounded-xl p-8 shadow-card text-center">
          <p className="text-status-error font-medium mb-2">
            Failed to load products. Please try again.
          </p>
          <p className="text-xs text-text-muted mb-4">{error.message}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Products Master Catalog
          </h1>
          <p className="text-xs text-text-muted">
            Manage manufactured products, SKUs, cost estimations, and CAD technical parameters
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canExport && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={16} />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          )}
          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => {
                setEditingProduct(null);
                setFormModalOpen(true);
              }}
            >
              Create Product
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Total SKUs Catalog"
          value={total}
          trend="Master Items"
          icon={<Package size={18} />}
          accent="primary"
        />
        <KPICard
          title="Active Products"
          value={activeCount}
          trend="In Production"
          icon={<CheckCircle2 size={18} />}
          accent="success"
        />
        <KPICard
          title="Archived SKUs"
          value={archivedCount}
          trend="Legacy Items"
          icon={<Archive size={18} />}
          accent="warning"
        />
      </div>

      <div className="bg-surface-card border border-border-default rounded-xl p-4 shadow-card flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Search size={16} />
          </div>
          <Input
            id="productSearch"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              resetPage();
            }}
            placeholder="Search product code or SKU description..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                resetPage();
              }}
              className="bg-background-primary border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="MECHANICAL">Mechanical</option>
              <option value="HARDWARE">Hardware</option>
              <option value="ASSEMBLY">Assembly</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                resetPage();
              }}
              className="bg-background-primary border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-text-muted text-xs">Loading products...</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-background-secondary/60 border-b border-border-default text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/50 text-text-primary">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-muted">
                      No products found matching filters.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-background-primary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-accent-primary">
                        {p.productCode}
                      </td>
                      <td className="py-3.5 px-4 font-bold">{p.productName}</td>
                      <td className="py-3.5 px-4 text-text-secondary truncate max-w-[200px]">
                        {p.description || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone={p.status === 'ACTIVE' ? 'green' : 'gray'}>{p.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canUpdate && (
                            <button
                              onClick={() => handleToggleArchive(p.id)}
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                p.status === 'ACTIVE'
                                  ? 'text-status-warning hover:bg-status-warning/10'
                                  : 'text-status-success hover:bg-status-success/10'
                              }`}
                            >
                              {p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                          <button
                            onClick={() => setDetailProduct(responseToProductData(p))}
                            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary"
                            title="View Specs"
                          >
                            <Eye size={15} />
                          </button>
                          {canUpdate && (
                            <button
                              onClick={() => {
                                setEditingProduct(responseToProductData(p));
                                setFormModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary"
                              title="Edit Product"
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(responseToProductData(p))}
                            className="p-1.5 rounded-lg text-status-error/80 hover:text-status-error hover:bg-status-error/10"
                            title="Delete Product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {total > PAGE_SIZE && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      <ProductFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleSaveProduct}
        initialData={editingProduct}
      />

      <ProductDetailModal
        open={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        product={detailProduct}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Product: ${deleteTarget?.productName}`}
        message="Are you sure you want to remove this product SKU from the master catalog?"
        tone="danger"
        confirmLabel="Delete SKU"
        loading={deleteProduct.isPending}
      />
    </div>
  );
};
