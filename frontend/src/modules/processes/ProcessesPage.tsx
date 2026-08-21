import React, { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AppPermission } from '../../constants/permissions';
import {
  useCreateProcess,
  useDeleteProcess,
  useRestoreProcess,
  useUpdateProcess,
  useProcesses,
} from '../../api/services/processes/hooks';
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
import { ProcessFormModal } from './ProcessFormModal';
import { ProcessDetailModal, processStatusLabel, processStatusTone } from './ProcessDetailModal';
import type {
  CreateProcessPayload,
  ProcessResponse,
  UpdateProcessPayload,
} from '../../types/process';

const PAGE_SIZE = 10;

type FormModalState = { mode: 'create' } | { mode: 'edit'; process: ProcessResponse } | null;

export const ProcessesPage: React.FC = () => {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { toasts, show, dismiss } = useToasts();

  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [detailProcess, setDetailProcess] = useState<ProcessResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProcessResponse | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const { records, addDeleted, removeDeleted } = useDeletedRecords('processes');

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      status: (statusFilter || undefined) as ProcessResponse['status'] | undefined,
    }),
    [page, search, statusFilter],
  );

  const processesQuery = useProcesses(query);
  const createMutation = useCreateProcess();
  const updateMutation = useUpdateProcess();
  const deleteMutation = useDeleteProcess();
  const restoreMutation = useRestoreProcess();

  const canCreate = hasPermission(AppPermission.PROCESSES_CREATE);
  const canUpdate = hasPermission(AppPermission.PROCESSES_UPDATE);
  const canDelete = hasPermission(AppPermission.PROCESSES_DELETE);
  const canRestore = hasPermission(AppPermission.PROCESSES_RESTORE);

  const hasActiveFilters = Boolean(search || statusFilter);

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    resetPage();
  };

  const handleCreate = () => {
    setFormModal({ mode: 'create' });
  };

  const handleEdit = (process: ProcessResponse) => {
    setDetailProcess(null);
    setFormModal({ mode: 'edit', process });
  };

  const handleFormSubmit = (values: CreateProcessPayload | UpdateProcessPayload) => {
    if (!formModal) return;

    if (formModal.mode === 'create') {
      createMutation.mutate(values as CreateProcessPayload, {
        onSuccess: (created) => {
          show('success', `Process "${created.processName}" created successfully.`);
          setFormModal(null);
        },
        onError: (error) => {
          show('error', getApiErrorMessage(error));
        },
      });
      return;
    }

    updateMutation.mutate(
      { id: formModal.process.id, payload: values as UpdateProcessPayload },
      {
        onSuccess: (updated) => {
          show('success', `Process "${updated.processName}" updated successfully.`);
          setFormModal(null);
          if (detailProcess?.id === updated.id) setDetailProcess(updated);
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
          summary: deleteTarget.processName,
          deletedAt: new Date().toISOString(),
        });
        show('success', `Process "${deleteTarget.processName}" deleted.`);
        setDeleteTarget(null);
        if (detailProcess?.id === deleteTarget.id) setDetailProcess(null);
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
        show('success', `Process "${restored.processName}" restored successfully.`);
        setShowDeleted(false);
      },
      onError: (error) => {
        show('error', getApiErrorMessage(error));
      },
    });
  };

  const { data, isLoading, isError, error, refetch, isFetching } = processesQuery;
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      <div className="bg-surface-card border border-border-default rounded-xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Manufacturing Processes
            </h1>
            <p className="text-text-muted mt-1">
              Manage enterprise process catalogue for product indents and costing
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
                Create Process
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted z-10"
            />
            <input
              type="text"
              className={`${inputClasses} pl-9`}
              placeholder="Search by process name..."
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                resetPage();
              }}
            />
          </div>

          <select
            className={inputClasses}
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              resetPage();
            }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className="mt-3">
            <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      <div className="bg-surface-card border border-border-default rounded-xl shadow-card overflow-hidden">
        {isError ? (
          <ErrorState
            title="Unable to load processes"
            message={getApiErrorMessage(
              error,
              'An unexpected error occurred while fetching processes.',
            )}
            onRetry={() => refetch()}
          />
        ) : isLoading && !data ? (
          <TableSkeleton rows={5} columns={4} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No processes found"
            description={
              hasActiveFilters
                ? 'No processes match the current filters. Try adjusting your search or filters.'
                : 'No manufacturing processes exist yet. Create your first process to get started.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : canCreate ? (
                <Button size="sm" icon={<Plus size={14} />} onClick={handleCreate}>
                  Create Process
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
                      Process Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Status
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
                  {items.map((process) => (
                    <tr
                      key={process.id}
                      className="hover:bg-background-secondary/70 transition-colors cursor-pointer"
                      onClick={() => setDetailProcess(process)}
                    >
                      <td className="px-6 py-3.5">
                        <div className="text-sm font-semibold text-text-primary">
                          {process.processName}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary max-w-md truncate">
                        {process.description || '-'}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge tone={processStatusTone[process.status]}>
                          {processStatusLabel[process.status]}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-muted">
                        {formatDateTime(process.updatedAt)}
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
                            aria-label={`View ${process.processName}`}
                            onClick={() => setDetailProcess(process)}
                          />
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Pencil size={15} />}
                              aria-label={`Edit ${process.processName}`}
                              onClick={() => handleEdit(process)}
                            />
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={15} />}
                              aria-label={`Delete ${process.processName}`}
                              onClick={() => setDeleteTarget(process)}
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

      <ProcessFormModal
        open={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        process={formModal?.mode === 'edit' ? formModal.process : null}
        loading={formModal?.mode === 'create' ? createMutation.isPending : updateMutation.isPending}
        onClose={() => setFormModal(null)}
        onSubmit={handleFormSubmit}
      />

      <ProcessDetailModal
        open={detailProcess !== null}
        process={detailProcess}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onClose={() => setDetailProcess(null)}
        onEdit={handleEdit}
        onDelete={(process) => setDeleteTarget(process)}
      />

      <DeletedRecordsModal
        open={showDeleted}
        title="Deleted Processes"
        records={records}
        loadingId={restoreMutation.isPending ? restoreMutation.variables : null}
        onClose={() => setShowDeleted(false)}
        onRestore={handleRestoreConfirm}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Process"
        message={
          deleteTarget && (
            <>
              Are you sure you want to delete{' '}
              <span className="font-medium">{deleteTarget.processName}</span>? Processes already
              used in indents or cost sheets cannot be deleted. Deleted records can be restored
              later.
            </>
          )
        }
        confirmLabel="Delete Process"
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
