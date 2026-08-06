import React, { useMemo, useCallback, useState } from 'react';
import { Layers, Plus, Search, Eye, Pencil, Trash2, Download } from 'lucide-react';
import {
  useMaterials,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
} from '../../api/services/materials/hooks';
import { useUnits } from '../../api/services/units/hooks';
import { useAuthStore } from '../../store/authStore';
import { AppPermission } from '../../constants/permissions';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../../utils/error';
import { downloadFile } from '../../utils/download';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ToastViewport, useToasts } from '../../components/ui/toast';
import { MaterialFormModal } from './MaterialFormModal';
import type { MaterialData } from './MaterialFormModal';
import { MaterialDetailModal } from './MaterialDetailModal';
import type {
  MaterialResponse,
  CreateMaterialPayload,
  UpdateMaterialPayload,
} from '../../api/types/material';

const PAGE_SIZE = 12;

function toMaterialData(res: MaterialResponse): MaterialData {
  return {
    id: res.id,
    materialCode: res.materialCode,
    materialName: res.materialName,
    category: res.category ?? '',
    unitOfMeasure: res.unitId,
    unitOfMeasureLabel: res.unitName ?? res.unitId,
    reorderPoint: res.minStock ?? 0,
    isActive: res.status === 'ACTIVE',
  };
}

export const MaterialsPage: React.FC = () => {
  const { toasts, show, dismiss } = useToasts();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 400);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingMat, setEditingMat] = useState<MaterialData | null>(null);
  const [detailMat, setDetailMat] = useState<MaterialData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaterialData | null>(null);

  const canCreate = hasPermission(AppPermission.MATERIALS_CREATE);
  const canUpdate = hasPermission(AppPermission.MATERIALS_UPDATE);
  const canDelete = hasPermission(AppPermission.MATERIALS_DELETE);
  const canExport = hasPermission(AppPermission.REPORTS_EXPORT);

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      category: categoryFilter || undefined,
    }),
    [page, search, categoryFilter],
  );

  const materialsQuery = useMaterials(query);
  const unitsQuery = useUnits({ page: 1, limit: 100 });
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const deleteMutation = useDeleteMaterial();

  const { data, isLoading, isError, error, refetch } = materialsQuery;
  const items = data?.items ?? [];
  const unitOptions = useMemo(
    () =>
      (unitsQuery.data?.items ?? []).map((u) => ({
        id: u.id,
        label: u.unitName,
        symbol: u.symbol,
      })),
    [unitsQuery.data],
  );

  const filteredMaterials = useMemo(() => items.map(toMaterialData), [items]);

  const hasActiveFilters = Boolean(search || categoryFilter);

  const resetPage = useCallback(() => setPage(1), []);

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setCategoryFilter('');
    resetPage();
  }, [resetPage]);

  const handleSaveMaterial = useCallback(
    async (matData: MaterialData) => {
      if (matData.id) {
        const payload: UpdateMaterialPayload = {
          materialCode: matData.materialCode,
          materialName: matData.materialName,
          category: matData.category,
          unitId: matData.unitOfMeasure,
          minStock: matData.reorderPoint,
          status: matData.isActive ? 'ACTIVE' : 'INACTIVE',
        };
        return new Promise<void>((resolve, reject) => {
          updateMutation.mutate(
            { id: matData.id!, payload },
            {
              onSuccess: () => {
                show('success', `Material "${matData.materialName}" updated successfully.`);
                setFormModalOpen(false);
                setEditingMat(null);
                resolve();
              },
              onError: (err: unknown) => {
                show('error', getApiErrorMessage(err));
                reject(err);
              },
            },
          );
        });
      }

      const payload: CreateMaterialPayload = {
        materialCode: matData.materialCode,
        materialName: matData.materialName,
        category: matData.category,
        unitId: matData.unitOfMeasure,
        minStock: matData.reorderPoint,
        status: matData.isActive ? 'ACTIVE' : 'INACTIVE',
      };
      return new Promise<void>((resolve, reject) => {
        createMutation.mutate(payload, {
          onSuccess: () => {
            show('success', `Material "${matData.materialName}" created successfully.`);
            setFormModalOpen(false);
            resetPage();
            resolve();
          },
          onError: (err: unknown) => {
            show('error', getApiErrorMessage(err));
            reject(err);
          },
        });
      });
    },
    [createMutation, updateMutation, show, resetPage],
  );

  const handleToggleStatus = useCallback(
    (mat: MaterialData) => {
      if (!mat.id) return;
      const payload: UpdateMaterialPayload = {
        status: mat.isActive ? 'INACTIVE' : 'ACTIVE',
      };
      updateMutation.mutate(
        { id: mat.id, payload },
        {
          onSuccess: () => {
            show(
              'success',
              `Material "${mat.materialName}" ${mat.isActive ? 'deactivated' : 'activated'}.`,
            );
          },
          onError: (err: unknown) => {
            show('error', getApiErrorMessage(err));
          },
        },
      );
    },
    [updateMutation, show],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget?.id) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        show('success', `Material "${deleteTarget.materialName}" deleted.`);
        setDeleteTarget(null);
        if (detailMat?.id === deleteTarget.id) setDetailMat(null);
      },
      onError: (err: unknown) => {
        show('error', getApiErrorMessage(err));
      },
    });
  }, [deleteTarget, deleteMutation, detailMat, show]);

  const handleExportCSV = useCallback(() => {
    const headers = [
      'Material Code',
      'Material Name',
      'Category',
      'UOM',
      'Reorder Point',
      'Status',
    ];
    const rows = filteredMaterials.map((m) => [
      m.materialCode,
      `"${m.materialName.replace(/"/g, '""')}"`,
      m.category,
      m.unitOfMeasureLabel,
      m.reorderPoint.toString(),
      m.isActive ? 'ACTIVE' : 'INACTIVE',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csvContent, 'materials_master.csv', 'text/csv');
  }, [filteredMaterials]);

  return (
    <div className="space-y-6 font-sans">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Raw Materials Master Catalog
          </h1>
          <p className="text-xs text-text-muted">
            Manage raw material classifications, inventory reorder thresholds, and stock UOMs
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
                setEditingMat(null);
                setFormModalOpen(true);
              }}
            >
              Create Material
            </Button>
          )}
        </div>
      </div>

      <div className="bg-surface-card border border-border-default rounded-xl p-4 shadow-card flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Search size={16} />
          </div>
          <input
            id="matSearch"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              resetPage();
            }}
            placeholder="Search material code or material description..."
            className="w-full bg-background-primary border border-border-default rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
          />
        </div>

        <div className="flex items-center gap-3">
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
              <option value="">All Categories</option>
              <option value="METALS">Metals & Steel</option>
              <option value="PLASTICS">Plastics & Polymers</option>
              <option value="ELECTRICAL">Electrical Wires</option>
              <option value="HARDWARE">Hardware</option>
              <option value="CHEMICALS">Chemicals</option>
            </select>
          </div>

          <span className="text-xs text-text-muted font-medium">
            Items: <strong className="text-text-primary">{data?.total ?? 0}</strong>
          </span>
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="Unable to load materials"
          message={getApiErrorMessage(
            error,
            'An unexpected error occurred while fetching materials.',
          )}
          onRetry={() => refetch()}
        />
      ) : isLoading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <EmptyState
          title="No materials found"
          description={
            hasActiveFilters
              ? 'No materials match the current filters. Try adjusting your search or category.'
              : 'No materials exist yet. Create your first material to get started.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : canCreate ? (
              <Button
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => {
                  setEditingMat(null);
                  setFormModalOpen(true);
                }}
              >
                Create Material
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((mat) => (
              <div
                key={mat.id}
                className="bg-surface-card border border-border-default rounded-xl p-5 space-y-4 shadow-card hover:border-border-strong transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary shrink-0">
                        <Layers size={18} />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-text-primary tracking-tight">
                          {mat.materialName}
                        </h3>
                        <span className="text-[10px] font-mono text-text-muted font-semibold">
                          CODE: {mat.materialCode}
                        </span>
                      </div>
                    </div>

                    <Badge tone={mat.isActive ? 'green' : 'gray'}>
                      {mat.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex justify-between items-center text-text-muted">
                      <span>Category:</span>
                      <span className="font-semibold text-text-primary">{mat.category}</span>
                    </div>
                    <div className="flex justify-between items-center text-text-muted">
                      <span>Reorder Threshold:</span>
                      <span className="font-bold text-status-warning">
                        {mat.reorderPoint} {mat.unitOfMeasureLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-default/50 flex items-center justify-between">
                  {canUpdate && (
                    <button
                      onClick={() => handleToggleStatus(mat)}
                      className={`text-[11px] font-semibold hover:underline ${
                        mat.isActive ? 'text-status-warning' : 'text-status-success'
                      }`}
                    >
                      {mat.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailMat(mat)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary"
                      title="View Specs"
                    >
                      <Eye size={16} />
                    </button>
                    {canUpdate && (
                      <button
                        onClick={() => {
                          setEditingMat(mat);
                          setFormModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary"
                        title="Edit Material"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteTarget(mat)}
                        className="p-1.5 rounded-lg text-status-error/80 hover:text-status-error hover:bg-status-error/10"
                        title="Delete Material"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={data?.page ?? 1}
            totalPages={data?.totalPages ?? 1}
            total={data?.total ?? 0}
            limit={data?.limit ?? PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <MaterialFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingMat(null);
        }}
        onSubmit={handleSaveMaterial}
        initialData={editingMat}
        unitOptions={unitOptions}
      />

      <MaterialDetailModal
        open={Boolean(detailMat)}
        onClose={() => setDetailMat(null)}
        material={detailMat}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Material: ${deleteTarget?.materialName}`}
        message="Are you sure you want to remove this raw material item from the master catalog?"
        tone="danger"
        confirmLabel="Delete Material"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};
