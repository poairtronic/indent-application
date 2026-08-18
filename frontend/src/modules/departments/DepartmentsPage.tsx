import React, { useState, useMemo, useCallback } from 'react';
import { Building2, Plus, Search, Eye, Pencil, Trash2, Users, UserCheck } from 'lucide-react';
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '../../api/services/departments/hooks';
import { useAuthStore } from '../../store/authStore';
import { AppPermission } from '../../constants/permissions';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../../utils/error';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ToastViewport, useToasts } from '../../components/ui/toast';
import { DepartmentFormModal } from './DepartmentFormModal';
import type { DepartmentData } from './DepartmentFormModal';
import { DepartmentDetailModal } from './DepartmentDetailModal';
import type {
  DepartmentResponse,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from '../../api/types/department';

const PAGE_SIZE = 9;

function toDepartmentData(res: DepartmentResponse): DepartmentData {
  return {
    id: res.id,
    departmentName: res.departmentName,
    departmentCode: res.departmentCode,
    headOfDepartment: res.headName ?? undefined,
    isActive: res.status === 'ACTIVE',
    memberCount: undefined,
  };
}

export const DepartmentsPage: React.FC = () => {
  const { toasts, show, dismiss } = useToasts();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 400);
  const [page, setPage] = useState(1);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentData | null>(null);
  const [detailDept, setDetailDept] = useState<DepartmentResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentResponse | null>(null);
  const [statusTarget, setStatusTarget] = useState<DepartmentResponse | null>(null);

  const canCreate = hasPermission(AppPermission.DEPARTMENTS_CREATE);
  const canUpdate = hasPermission(AppPermission.DEPARTMENTS_UPDATE);
  const canDelete = hasPermission(AppPermission.DEPARTMENTS_DELETE);

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
    }),
    [page, search],
  );

  const departmentsQuery = useDepartments(query);
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const { data, isLoading, isError, error, refetch } = departmentsQuery;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleCreate = useCallback(() => {
    setEditingDept(null);
    setFormModalOpen(true);
  }, []);

  const handleEdit = useCallback((dept: DepartmentResponse) => {
    setDetailDept(null);
    setEditingDept(toDepartmentData(dept));
    setFormModalOpen(true);
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const handleSaveDepartment = useCallback(
    async (deptData: DepartmentData) => {
      if (deptData.id) {
        const payload: UpdateDepartmentPayload = {
          departmentCode: deptData.departmentCode,
          departmentName: deptData.departmentName,
          status: deptData.isActive ? 'ACTIVE' : 'INACTIVE',
        };
        return new Promise<void>((resolve, reject) => {
          updateMutation.mutate(
            { id: deptData.id!, payload },
            {
              onSuccess: () => {
                show('success', `Department "${deptData.departmentName}" updated successfully.`);
                setFormModalOpen(false);
                setEditingDept(null);
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

      const payload: CreateDepartmentPayload = {
        departmentCode: deptData.departmentCode,
        departmentName: deptData.departmentName,
        status: deptData.isActive ? 'ACTIVE' : 'INACTIVE',
      };
      return new Promise<void>((resolve, reject) => {
        createMutation.mutate(payload, {
          onSuccess: () => {
            show('success', `Department "${deptData.departmentName}" created successfully.`);
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

  const handleStatusConfirm = useCallback(() => {
    if (!statusTarget) return;
    const newStatus = statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateMutation.mutate(
      { id: statusTarget.id, payload: { status: newStatus } },
      {
        onSuccess: () => {
          show(
            'success',
            `Department "${statusTarget.departmentName}" ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`,
          );
          setStatusTarget(null);
        },
        onError: (err: unknown) => {
          show('error', getApiErrorMessage(err));
        },
      },
    );
  }, [statusTarget, updateMutation, show]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        show('success', `Department "${deleteTarget.departmentName}" deleted.`);
        setDeleteTarget(null);
        if (detailDept?.id === deleteTarget.id) setDetailDept(null);
      },
      onError: (err: unknown) => {
        show('error', getApiErrorMessage(err));
      },
    });
  }, [deleteTarget, deleteMutation, detailDept, show]);

  return (
    <div className="space-y-6 font-sans">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Operating Departments Management
          </h1>
          <p className="text-xs text-text-muted">
            Configure business units, head of department assignments, and organizational structures
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={handleCreate}>
            Create Department
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface-card border border-border-default rounded-xl p-4 shadow-card">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Search size={16} />
          </div>
          <Input
            id="deptSearch"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              resetPage();
            }}
            placeholder="Search department name, code, or HOD..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted font-medium">
          <span>Operating Units:</span>
          <span className="font-bold text-text-primary bg-background-secondary px-2 py-1 rounded border border-border-default">
            {total} Units
          </span>
        </div>
      </div>

      {isError ? (
        <div className="bg-surface-card border border-status-error/30 rounded-xl p-8 text-center">
          <p className="text-status-error font-medium mb-2">Failed to load departments</p>
          <p className="text-xs text-text-muted mb-4">
            {getApiErrorMessage(error, 'An unexpected error occurred.')}
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="bg-surface-card border border-border-default rounded-xl p-5 space-y-4 shadow-card animate-pulse"
            >
              <div className="h-4 bg-background-secondary rounded w-3/4" />
              <div className="h-3 bg-background-secondary rounded w-1/2" />
              <div className="h-3 bg-background-secondary rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface-card border border-border-default rounded-xl p-8 text-center">
          <Building2 size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm font-medium text-text-primary mb-1">No departments found</p>
          <p className="text-xs text-text-muted">
            {search
              ? 'No departments match your search. Try adjusting your search terms.'
              : 'No departments exist yet. Create your first department to get started.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((dept) => (
              <div
                key={dept.id}
                className="bg-surface-card border border-border-default rounded-xl p-5 space-y-4 shadow-card hover:border-border-strong transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary shrink-0">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-text-primary tracking-tight">
                          {dept.departmentName}
                        </h3>
                        <span className="text-[10px] font-mono text-text-muted font-semibold">
                          CODE: {dept.departmentCode}
                        </span>
                      </div>
                    </div>

                    <Badge tone={dept.status === 'ACTIVE' ? 'green' : 'gray'}>
                      {dept.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <UserCheck size={14} className="text-accent-primary" /> HOD:
                      </span>
                      <span className="font-bold text-text-primary">
                        {dept.headName || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Users size={14} className="text-accent-primary" /> Active Personnel:
                      </span>
                      <span className="font-semibold text-text-primary">{'—'} Members</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-default/50 flex items-center justify-between">
                  {canUpdate && (
                    <button
                      onClick={() => setStatusTarget(dept)}
                      className={`text-[11px] font-semibold hover:underline ${
                        dept.status === 'ACTIVE' ? 'text-status-warning' : 'text-status-success'
                      }`}
                    >
                      {dept.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailDept(dept)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary transition-colors"
                      title="View Department Details"
                    >
                      <Eye size={16} />
                    </button>
                    {canUpdate && (
                      <button
                        onClick={() => handleEdit(dept)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary transition-colors"
                        title="Edit Department"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteTarget(dept)}
                        className="p-1.5 rounded-lg text-status-error/80 hover:text-status-error hover:bg-status-error/10 transition-colors"
                        title="Delete Department"
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
            totalPages={totalPages}
            total={total}
            limit={data?.limit ?? PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <DepartmentFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleSaveDepartment}
        initialData={editingDept}
      />

      <DepartmentDetailModal
        isOpen={Boolean(detailDept)}
        onClose={() => setDetailDept(null)}
        department={detailDept ? toDepartmentData(detailDept) : null}
      />

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onCancel={() => setStatusTarget(null)}
        onConfirm={handleStatusConfirm}
        title={`${statusTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} Department: ${statusTarget?.departmentName}`}
        message={
          statusTarget?.status === 'ACTIVE'
            ? 'Are you sure you want to deactivate this department? It will be hidden from active listings.'
            : 'Are you sure you want to activate this department?'
        }
        tone={statusTarget?.status === 'ACTIVE' ? 'warning' : 'success'}
        confirmLabel={statusTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Department: ${deleteTarget?.departmentName}`}
        message="Are you sure you want to delete this department? Members assigned to this department will require re-assignment."
        tone="danger"
        confirmLabel="Delete Department"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};
