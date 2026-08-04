import React, { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AppPermission } from '../../constants/permissions';
import {
  useCreateVendor,
  useDeleteVendor,
  useRestoreVendor,
  useUpdateVendor,
  useVendors,
} from '../../api/services/vendors/hooks';
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
import { VendorFormModal } from './VendorFormModal';
import { VendorDetailModal, vendorStatusLabel, vendorStatusTone } from './VendorDetailModal';
import type { CreateVendorPayload, UpdateVendorPayload, VendorResponse } from '../../types/vendor';

const PAGE_SIZE = 10;

type FormModalState = { mode: 'create' } | { mode: 'edit'; vendor: VendorResponse } | null;

export const VendorsPage: React.FC = () => {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { toasts, show, dismiss } = useToasts();

  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [detailVendor, setDetailVendor] = useState<VendorResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorResponse | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const { records, addDeleted, removeDeleted } = useDeletedRecords('vendors');

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      status: (statusFilter || undefined) as VendorResponse['status'] | undefined,
    }),
    [page, search, statusFilter],
  );

  const vendorsQuery = useVendors(query);
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();
  const deleteMutation = useDeleteVendor();
  const restoreMutation = useRestoreVendor();

  const canCreate = hasPermission(AppPermission.VENDORS_CREATE);
  const canUpdate = hasPermission(AppPermission.VENDORS_UPDATE);
  const canDelete = hasPermission(AppPermission.VENDORS_DELETE);
  const canRestore = hasPermission(AppPermission.VENDORS_RESTORE);

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

  const handleEdit = (vendor: VendorResponse) => {
    setDetailVendor(null);
    setFormModal({ mode: 'edit', vendor });
  };

  const handleFormSubmit = (values: CreateVendorPayload | UpdateVendorPayload) => {
    if (!formModal) return;

    if (formModal.mode === 'create') {
      createMutation.mutate(values as CreateVendorPayload, {
        onSuccess: (created) => {
          show('success', `Vendor "${created.vendorName}" created successfully.`);
          setFormModal(null);
        },
        onError: (error) => {
          show('error', getApiErrorMessage(error));
        },
      });
      return;
    }

    updateMutation.mutate(
      { id: formModal.vendor.id, payload: values as UpdateVendorPayload },
      {
        onSuccess: (updated) => {
          show('success', `Vendor "${updated.vendorName}" updated successfully.`);
          setFormModal(null);
          if (detailVendor?.id === updated.id) setDetailVendor(updated);
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
          summary: `${deleteTarget.vendorCode} Â· ${deleteTarget.vendorName}`,
          deletedAt: new Date().toISOString(),
        });
        show('success', `Vendor "${deleteTarget.vendorName}" deleted.`);
        setDeleteTarget(null);
        if (detailVendor?.id === deleteTarget.id) setDetailVendor(null);
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
        show('success', `Vendor "${restored.vendorName}" restored successfully.`);
        setShowDeleted(false);
      },
      onError: (error) => {
        show('error', getApiErrorMessage(error));
      },
    });
  };

  const { data, isLoading, isError, error, refetch, isFetching } = vendorsQuery;
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      <div className="bg-surface-card border border-border-default rounded-xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Vendors</h1>
            <p className="text-text-muted mt-1">
              Manage vendor master data used in material pricing and cost sheets
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
                Create Vendor
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
              placeholder="Search by code, name, email or GST..."
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
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="BLACKLISTED">Blacklisted</option>
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
            title="Unable to load vendors"
            message={getApiErrorMessage(
              error,
              'An unexpected error occurred while fetching vendors.',
            )}
            onRetry={() => refetch()}
          />
        ) : isLoading && !data ? (
          <TableSkeleton rows={5} columns={6} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No vendors found"
            description={
              hasActiveFilters
                ? 'No vendors match the current filters. Try adjusting your search or filters.'
                : 'No vendors exist yet. Create your first vendor to get started.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : canCreate ? (
                <Button size="sm" icon={<Plus size={14} />} onClick={handleCreate}>
                  Create Vendor
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
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      GST Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      City
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
                  {items.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="hover:bg-background-secondary/70 transition-colors cursor-pointer"
                      onClick={() => setDetailVendor(vendor)}
                    >
                      <td className="px-6 py-3.5">
                        <div className="text-sm font-medium text-text-primary">
                          {vendor.vendorName}
                        </div>
                        <div className="text-xs text-text-muted">{vendor.vendorCode}</div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{vendor.email}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">
                        {vendor.gstNumber ?? '-'}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{vendor.city}</td>
                      <td className="px-6 py-3.5">
                        <Badge tone={vendorStatusTone[vendor.status]}>
                          {vendorStatusLabel[vendor.status]}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-muted">
                        {formatDateTime(vendor.updatedAt)}
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
                            aria-label={`View ${vendor.vendorName}`}
                            onClick={() => setDetailVendor(vendor)}
                          />
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Pencil size={15} />}
                              aria-label={`Edit ${vendor.vendorName}`}
                              onClick={() => handleEdit(vendor)}
                            />
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={15} />}
                              aria-label={`Delete ${vendor.vendorName}`}
                              onClick={() => setDeleteTarget(vendor)}
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

      <VendorFormModal
        open={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        vendor={formModal?.mode === 'edit' ? formModal.vendor : null}
        loading={formModal?.mode === 'create' ? createMutation.isPending : updateMutation.isPending}
        onClose={() => setFormModal(null)}
        onSubmit={handleFormSubmit}
      />

      <VendorDetailModal
        open={detailVendor !== null}
        vendor={detailVendor}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onClose={() => setDetailVendor(null)}
        onEdit={handleEdit}
        onDelete={(vendor) => setDeleteTarget(vendor)}
      />

      <DeletedRecordsModal
        open={showDeleted}
        title="Deleted Vendors"
        records={records}
        loadingId={restoreMutation.isPending ? restoreMutation.variables : null}
        onClose={() => setShowDeleted(false)}
        onRestore={handleRestoreConfirm}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Vendor"
        message={
          deleteTarget && (
            <>
              Are you sure you want to delete{' '}
              <span className="font-medium">
                {deleteTarget.vendorCode} Â· {deleteTarget.vendorName}
              </span>
              ? Vendors already used in material pricing or cost sheets cannot be deleted. Deleted
              records can be restored later.
            </>
          )
        }
        confirmLabel="Delete Vendor"
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
