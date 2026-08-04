import React, { useMemo, useState } from 'react';
import { Eye, Pencil, PowerOff, RotateCcw, Search, Trash2, UserPlus, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AppPermission } from '../../constants/permissions';
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUpdateUserStatus,
  useUsers,
  useUserRoles,
} from '../../api/services/users/hooks';
import { useDepartmentOptions } from '../../api/services/departments/hooks';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../../utils/error';
import { formatDateTime } from '../../utils/date';
import { Button } from '../../components/ui/Button';
import { Badge, statusLabel, statusTone } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ToastViewport, useToasts } from '../../components/ui/toast';
import { inputClasses } from '../../components/ui/inputClasses';
import { UserFormModal } from './UserFormModal';
import { UserDetailModal } from './UserDetailModal';
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserResponse,
  UserStatus,
} from '../../types/user';

const PAGE_SIZE = 10;

const fullName = (user: UserResponse): string => `${user.firstName} ${user.lastName}`;

const initials = (user: UserResponse): string =>
  `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

const nextStatus = (user: UserResponse): UserStatus =>
  user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

type FormModalState = { mode: 'create' } | { mode: 'edit'; user: UserResponse } | null;

export const UsersPage: React.FC = () => {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { toasts, show, dismiss } = useToasts();

  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 400);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [detailUser, setDetailUser] = useState<UserResponse | null>(null);
  const [statusTarget, setStatusTarget] = useState<UserResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      departmentId: departmentFilter || undefined,
      roleId: roleFilter || undefined,
      status: (statusFilter || undefined) as UserStatus | undefined,
    }),
    [page, search, departmentFilter, roleFilter, statusFilter],
  );

  const usersQuery = useUsers(query);
  const rolesQuery = useUserRoles();
  const departmentQuery = useDepartmentOptions();
  const departments = departmentQuery.data ?? [];
  const roles = rolesQuery.data ?? [];

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const statusMutation = useUpdateUserStatus();
  const deleteMutation = useDeleteUser();

  const canCreate = hasPermission(AppPermission.USERS_CREATE);
  const canUpdate = hasPermission(AppPermission.USERS_UPDATE);
  const canStatus = hasPermission(AppPermission.USERS_STATUS_UPDATE);
  const canDelete = hasPermission(AppPermission.USERS_DELETE);

  const hasActiveFilters = Boolean(search || departmentFilter || roleFilter || statusFilter);

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setSearchInput('');
    setDepartmentFilter('');
    setRoleFilter('');
    setStatusFilter('');
    resetPage();
  };

  const handleCreate = () => {
    setFormModal({ mode: 'create' });
  };

  const handleEdit = (user: UserResponse) => {
    setDetailUser(null);
    setFormModal({ mode: 'edit', user });
  };

  const handleFormSubmit = (values: CreateUserPayload | UpdateUserPayload) => {
    if (!formModal) return;

    if (formModal.mode === 'create') {
      createMutation.mutate(values as CreateUserPayload, {
        onSuccess: (created) => {
          show('success', `User "${fullName(created)}" created successfully.`);
          setFormModal(null);
        },
        onError: (error) => {
          show('error', getApiErrorMessage(error));
        },
      });
      return;
    }

    updateMutation.mutate(
      { id: formModal.user.id, payload: values as UpdateUserPayload },
      {
        onSuccess: (updated) => {
          show('success', `User "${fullName(updated)}" updated successfully.`);
          setFormModal(null);
          if (detailUser?.id === updated.id) setDetailUser(updated);
        },
        onError: (error) => {
          show('error', getApiErrorMessage(error));
        },
      },
    );
  };

  const handleStatusConfirm = () => {
    if (!statusTarget) return;

    const target = nextStatus(statusTarget);
    statusMutation.mutate(
      { id: statusTarget.id, status: target },
      {
        onSuccess: (updated) => {
          show(
            'success',
            `"${fullName(updated)}" is now ${statusLabel[updated.status].toLowerCase()}.`,
          );
          setStatusTarget(null);
          if (detailUser?.id === updated.id) setDetailUser(updated);
        },
        onError: (error) => {
          show('error', getApiErrorMessage(error));
        },
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    if (deleteTarget.id === currentUserId) {
      show('error', 'You cannot delete your own account.');
      setDeleteTarget(null);
      return;
    }

    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        show('success', `User "${fullName(deleteTarget)}" deleted.`);
        setDeleteTarget(null);
        if (detailUser?.id === deleteTarget.id) setDetailUser(null);
        if (formModal && 'user' in formModal && formModal.user.id === deleteTarget.id) {
          setFormModal(null);
        }
      },
      onError: (error) => {
        show('error', getApiErrorMessage(error));
      },
    });
  };

  const { data, isLoading, isError, error, refetch, isFetching } = usersQuery;
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      <div className="bg-surface-card border border-border-default rounded-xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Users</h1>
            <p className="text-text-muted mt-1">Manage user accounts, roles, and access</p>
          </div>
          <div className="flex items-center gap-2">
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
              <Button size="sm" icon={<UserPlus size={14} />} onClick={handleCreate}>
                Create User
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              className={`${inputClasses} pl-9`}
              placeholder="Search by name, email or employee code..."
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                resetPage();
              }}
            />
          </div>

          <select
            className={inputClasses}
            value={departmentFilter}
            onChange={(event) => {
              setDepartmentFilter(event.target.value);
              resetPage();
            }}
          >
            <option value="">All Departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>

          <select
            className={inputClasses}
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              resetPage();
            }}
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.roleName}
              </option>
            ))}
          </select>

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
            <option value="SUSPENDED">Suspended</option>
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
            title="Unable to load users"
            message={getApiErrorMessage(
              error,
              'An unexpected error occurred while fetching users.',
            )}
            onRetry={() => refetch()}
          />
        ) : isLoading && !data ? (
          <TableSkeleton rows={5} columns={6} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No users found"
            description={
              hasActiveFilters
                ? 'No users match the current filters. Try adjusting your search or filters.'
                : 'No user accounts exist yet. Create your first user to get started.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : canCreate ? (
                <Button size="sm" icon={<UserPlus size={14} />} onClick={handleCreate}>
                  Create User
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
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {items.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-background-secondary/70 transition-colors cursor-pointer"
                      onClick={() => setDetailUser(user)}
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={fullName(user)}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-semibold text-sm">
                              {initials(user)}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-text-primary">
                              {fullName(user)}
                            </div>
                            <div className="text-xs text-text-muted">{user.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{user.email}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">
                        {user.departmentName ?? '-'}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">
                        {user.roleName ?? '-'}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge tone={statusTone[user.status]}>{statusLabel[user.status]}</Badge>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-muted">
                        {user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
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
                            aria-label={`View ${fullName(user)}`}
                            onClick={() => setDetailUser(user)}
                          />
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Pencil size={15} />}
                              aria-label={`Edit ${fullName(user)}`}
                              onClick={() => handleEdit(user)}
                            />
                          )}
                          {canStatus && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<PowerOff size={15} />}
                              aria-label={`${user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} ${fullName(user)}`}
                              onClick={() => setStatusTarget(user)}
                            />
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={15} />}
                              aria-label={`Delete ${fullName(user)}`}
                              onClick={() => setDeleteTarget(user)}
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

      <UserFormModal
        open={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        user={formModal?.mode === 'edit' ? formModal.user : null}
        departments={departments}
        roles={roles}
        loading={formModal?.mode === 'create' ? createMutation.isPending : updateMutation.isPending}
        onClose={() => setFormModal(null)}
        onSubmit={handleFormSubmit}
      />

      <UserDetailModal
        open={detailUser !== null}
        user={detailUser}
        canUpdate={canUpdate}
        canStatus={canStatus}
        canDelete={canDelete}
        onClose={() => setDetailUser(null)}
        onEdit={handleEdit}
        onStatusChange={(user) => setStatusTarget(user)}
        onDelete={(user) => setDeleteTarget(user)}
      />

      <ConfirmDialog
        open={statusTarget !== null}
        title={
          statusTarget && statusTarget.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'
        }
        message={
          statusTarget && (
            <>
              Set <span className="font-medium">{fullName(statusTarget)}</span> to{' '}
              <span className="font-medium">
                {statusLabel[nextStatus(statusTarget)].toLowerCase()}
              </span>
              ?{' '}
              {nextStatus(statusTarget) === 'INACTIVE' &&
                " This will revoke the user's active sessions."}
            </>
          )
        }
        confirmLabel={statusTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        tone="primary"
        loading={statusMutation.isPending}
        onConfirm={handleStatusConfirm}
        onCancel={() => setStatusTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete User"
        message={
          deleteTarget && (
            <>
              Are you sure you want to permanently remove{' '}
              <span className="font-medium">{fullName(deleteTarget)}</span>? This action will revoke
              their access and can be restored later by an administrator.
            </>
          )
        }
        confirmLabel="Delete User"
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
