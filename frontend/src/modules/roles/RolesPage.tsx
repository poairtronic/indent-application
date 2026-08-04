import React, { useState, useMemo } from 'react';
import { Shield, Plus, Search, Eye, Pencil, Trash2, Users } from 'lucide-react';
import { useRoles, useDeleteRole } from '../../api/services/roles/hooks';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAuthStore } from '../../store/authStore';
import { AppPermission } from '../../constants/permissions';
import { getApiErrorMessage } from '../../utils/error';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { RoleFormModal } from './RoleFormModal';
import type { RoleData } from './RoleFormModal';
import { RoleDetailModal } from './RoleDetailModal';
import type { RoleResponse } from '../../types/user';

function toRoleData(role: RoleResponse): RoleData {
  return {
    id: role.id,
    roleName: role.roleName,
    description: role.description ?? '',
    permissions: role.permissions ?? [],
  };
}

export const RolesPage: React.FC = () => {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [detailRole, setDetailRole] = useState<RoleResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleResponse | null>(null);

  const canCreate = hasPermission(AppPermission.ROLES_CREATE);
  const canUpdate = hasPermission(AppPermission.ROLES_UPDATE);
  const canDelete = hasPermission(AppPermission.ROLES_DELETE);

  const rolesQuery = useRoles();
  const deleteMutation = useDeleteRole();

  const { data: roles = [], isLoading, isError, error, refetch } = rolesQuery;

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const term = search.toLowerCase();
    return roles.filter(
      (r) =>
        r.roleName.toLowerCase().includes(term) ||
        (r.description ?? '').toLowerCase().includes(term),
    );
  }, [roles, search]);

  const handleSaveRole = async (_roleData: RoleData) => {
    // Create/update is handled by RoleFormModal via React Query mutations.
    // Cache invalidation is handled in the hooks.
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        if (detailRole?.id === deleteTarget.id) setDetailRole(null);
      },
      onError: (err) => {
        void getApiErrorMessage(err);
      },
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Role & Authority Management
          </h1>
          <p className="text-xs text-text-muted">
            Configure enterprise RBAC security roles, permission matrices, and access control scopes
          </p>
        </div>
        {canCreate && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingRole(null);
              setFormModalOpen(true);
            }}
          >
            Create New Role
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface-card border border-border-default rounded-xl p-4 shadow-card">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Search size={16} />
          </div>
          <Input
            id="roleSearch"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search roles or permission scopes..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted font-medium">
          <span>Active Roles:</span>
          <span className="font-bold text-text-primary bg-background-secondary px-2 py-1 rounded border border-border-default">
            {roles.length} Roles
          </span>
        </div>
      </div>

      {isError ? (
        <div className="bg-surface-card border border-status-error/30 rounded-xl p-8 text-center">
          <p className="text-status-error font-medium mb-2">Failed to load roles</p>
          <p className="text-xs text-text-muted mb-4">
            {getApiErrorMessage(error, 'An unexpected error occurred.')}
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
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
      ) : filteredRoles.length === 0 ? (
        <div className="bg-surface-card border border-border-default rounded-xl p-8 text-center">
          <Shield size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm font-medium text-text-primary mb-1">No roles found</p>
          <p className="text-xs text-text-muted">
            {search
              ? 'No roles match your search. Try adjusting your search terms.'
              : 'No roles exist yet. Create your first role to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="bg-surface-card border border-border-default rounded-xl p-5 space-y-4 shadow-card hover:border-border-strong transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary shrink-0">
                      <Shield size={18} />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-text-primary tracking-tight">
                        {role.roleName}
                      </h3>
                      <span className="text-[10px] text-text-muted font-semibold">
                        ID: {role.id}
                      </span>
                    </div>
                  </div>
                  <Badge tone="blue">{role.permissions?.length || 0} Scopes</Badge>
                </div>

                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {role.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-border-default/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
                  <Users size={14} />
                  <span>Assigned Users</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDetailRole(role)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary transition-colors"
                    title="View Role Details"
                  >
                    <Eye size={16} />
                  </button>
                  {canUpdate && (
                    <button
                      onClick={() => {
                        setEditingRole(toRoleData(role));
                        setFormModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary transition-colors"
                      title="Edit Role & Permissions"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setDeleteTarget(role)}
                      className="p-1.5 rounded-lg text-status-error/80 hover:text-status-error hover:bg-status-error/10 transition-colors"
                      title="Delete Role"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RoleFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleSaveRole}
        initialData={editingRole}
      />

      <RoleDetailModal
        isOpen={Boolean(detailRole)}
        onClose={() => setDetailRole(null)}
        role={detailRole ? toRoleData(detailRole) : null}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Role: ${deleteTarget?.roleName}`}
        message="Are you sure you want to delete this role? Users assigned to this role will require immediate re-assignment."
        tone="danger"
        confirmLabel="Delete Role"
      />
    </div>
  );
};
