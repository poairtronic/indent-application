import React, { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AppPermission } from '../../constants/permissions';
import {
  useCreateUnit,
  useDeleteUnit,
  useRestoreUnit,
  useUnits,
  useUpdateUnit,
} from '../../hooks/useUnits';
import { useDeletedRecords } from '../../hooks/useDeletedRecords';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../../utils/error';
import { formatDateTime } from '../../utils/date';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DeletedRecordsModal } from '../../components/ui/DeletedRecordsModal';
import { ToastViewport, useToasts } from '../../components/ui/toast';
import { inputClasses } from '../../components/ui/inputClasses';
import { UnitFormModal } from './UnitFormModal';
import { UnitDetailModal } from './UnitDetailModal';
import type { CreateUnitPayload, UnitResponse, UpdateUnitPayload } from '../../types/unit';

const PAGE_SIZE = 10;

type FormModalState = { mode: 'create' } | { mode: 'edit'; unit: UnitResponse } | null;

export const UnitsPage: React.FC = () => {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { toasts, show, dismiss } = useToasts();

  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 400);
  const [page, setPage] = useState(1);

  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [detailUnit, setDetailUnit] = useState<UnitResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnitResponse | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const { records, addDeleted, removeDeleted } = useDeletedRecords('units');

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
    }),
    [page, search],
  );

  const unitsQuery = useUnits(query);
  const createMutation = useCreateUnit();
  const updateMutation = useUpdateUnit();
  const deleteMutation = useDeleteUnit();
  const restoreMutation = useRestoreUnit();

  const canCreate = hasPermission(AppPermission.UNITS_CREATE);
  const canUpdate = hasPermission(AppPermission.UNITS_UPDATE);
  const canDelete = hasPermission(AppPermission.UNITS_DELETE);
  const canRestore = hasPermission(AppPermission.UNITS_RESTORE);

  const hasActiveFilters = Boolean(search);

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setSearchInput('');
    resetPage();
  };

  const handleCreate = () => {
    setFormModal({ mode: 'create' });
  };

  const handleEdit = (unit: UnitResponse) => {
    setDetailUnit(null);
    setFormModal({ mode: 'edit', unit });
  };

  const handleFormSubmit = (values: CreateUnitPayload | UpdateUnitPayload) => {
    if (!formModal) return;

    if (formModal.mode === 'create') {
      createMutation.mutate(values as CreateUnitPayload, {
        onSuccess: (created) => {
          show('success', `Unit "${created.unitName}" created successfully.`);
          setFormModal(null);
        },
        onError: (error) => {
          show('error', getApiErrorMessage(error));
        },
      });
      return;
    }

    updateMutation.mutate(
      { id: formModal.unit.id, payload: values as UpdateUnitPayload },
      {
        onSuccess: (updated) => {
          show('success', `Unit "${updated.unitName}" updated successfully.`);
          setFormModal(null);
          if (detailUnit?.id === updated.id) setDetailUnit(updated);
        },
        onError: (error) => {
          show('error', getApiErrorMessage(error));
        },
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        addDeleted({
          id: deleteTarget.id,
          summary: `${deleteTarget.unitCode} · ${deleteTarget.unitName}`,
          deletedAt: new Date().toISOString(),
        });
        show('success', `Unit "${deleteTarget.unitName}" deleted.`);
        setDeleteTarget(null);
        if (detailUnit?.id === deleteTarget.id) setDetailUnit(null);
      },
      onError: (error) => {
        show('error', getApiErrorMessage(error));
      },
    });
  };

  const handleRestoreConfirm = (id: string) => {
    restoreMutation.mutate(id, {
      onSuccess: (restored) => {
        removeDeleted(id);
        show('success', `Unit "${restored.unitName}" restored successfully.`);
        setShowDeleted(false);
      },
      onError: (error) => {
        show('error', getApiErrorMessage(error));
      },
    });
  };

  const { data, isLoading, isError, error, refetch, isFetching } = unitsQuery;
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      <div className="bg-surface-card border border-border-default rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Units</h1>
            <p className="text-text-muted mt-1">
              Manage units of measure used across materials, indents, and production
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canRestore && records.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                icon={<RotateCcw size={14} />}
                onClick={() => setShowDeleted(true)}
              >
                Deleted ({records.length})
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Refresh
            </Button>
            {canCreate && (
              <Button size="sm" icon={<Plus size={14} />} onClick={handleCreate}>
                Create Unit
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              className={`${inputClasses} pl-9`}
              placeholder="Search by code, name or symbol..."
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                resetPage();
              }}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3">
            <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={clearFilters}>
              Clear search
            </Button>
          </div>
        )}
      </div>

      <div className="bg-surface-card border border-border-default rounded-xl shadow-sm overflow-hidden">
        {isError ? (
          <ErrorState
            title="Unable to load units"
            message={getApiErrorMessage(
              error,
              'An unexpected error occurred while fetching units.',
            )}
            onRetry={() => refetch()}
          />
        ) : isLoading && !data ? (
          <TableSkeleton rows={5} columns={5} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No units found"
            description={
              hasActiveFilters
                ? 'No units match the current search. Try a different search term.'
                : 'No units exist yet. Create your first unit to get started.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear search
                </Button>
              ) : canCreate ? (
                <Button size="sm" icon={<Plus size={14} />} onClick={handleCreate}>
                  Create Unit
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-default">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {items.map((unit) => (
                    <tr
                      key={unit.id}
                      className="hover:bg-background-secondary/70 transition-colors cursor-pointer"
                      onClick={() => setDetailUnit(unit)}
                    >
                      <td className="px-6 py-3.5 text-sm font-medium text-text-primary">
                        {unit.unitCode}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{unit.unitName}</td>
                      <td className="px-6 py-3.5">
                        <Badge tone="blue">{unit.symbol}</Badge>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-muted">
                        {formatDateTime(unit.updatedAt)}
                      </td>
                      <td
                        className="px-6 py-3.5 text-right whitespace-nowrap"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye size={15} />}
                            aria-label={`View ${unit.unitName}`}
                            onClick={() => setDetailUnit(unit)}
                          />
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Pencil size={15} />}
                              aria-label={`Edit ${unit.unitName}`}
                              onClick={() => handleEdit(unit)}
                            />
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={15} />}
                              aria-label={`Delete ${unit.unitName}`}
                              onClick={() => setDeleteTarget(unit)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      </div>

      <UnitFormModal
        open={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        unit={formModal?.mode === 'edit' ? formModal.unit : null}
        loading={formModal?.mode === 'create' ? createMutation.isPending : updateMutation.isPending}
        onClose={() => setFormModal(null)}
        onSubmit={handleFormSubmit}
      />

      <UnitDetailModal
        open={detailUnit !== null}
        unit={detailUnit}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onClose={() => setDetailUnit(null)}
        onEdit={handleEdit}
        onDelete={(unit) => setDeleteTarget(unit)}
      />

      <DeletedRecordsModal
        open={showDeleted}
        title="Deleted Units"
        records={records}
        loadingId={restoreMutation.isPending ? restoreMutation.variables : null}
        onClose={() => setShowDeleted(false)}
        onRestore={handleRestoreConfirm}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Unit"
        message={
          deleteTarget && (
            <>
              Are you sure you want to delete{' '}
              <span className="font-medium">
                {deleteTarget.unitCode} · {deleteTarget.unitName}
              </span>
              ? Units already used by materials, indents, or additional materials cannot be deleted.
              Deleted records can be restored later.
            </>
          )
        }
        confirmLabel="Delete Unit"
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
