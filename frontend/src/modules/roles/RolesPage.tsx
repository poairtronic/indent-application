import React, { useState, useMemo } from 'react';
import { Shield, Plus, Search, Eye, Pencil, Trash2, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { RoleFormModal } from './RoleFormModal';
import type { RoleData } from './RoleFormModal';
import { RoleDetailModal } from './RoleDetailModal';
import { MODULE_PERMISSIONS } from '../../constants/permissions';

const INITIAL_ROLES: RoleData[] = [
  {
    id: 'role-1',
    roleName: 'SYSTEM_ADMIN',
    description: 'Full administrative access across all system modules and environment parameters',
    permissions: Object.values(MODULE_PERMISSIONS).flat() as string[],
  },
  {
    id: 'role-2',
    roleName: 'GENERAL_MANAGER',
    description: 'Executive oversight, read-only analytics, and workflow passive monitoring',
    permissions: [
      'users.view',
      'roles.view',
      'indent.view',
      'costsheet.view',
      'workflow.view',
      'reports.view',
      'analytics.view',
    ],
  },
  {
    id: 'role-3',
    roleName: 'STORES_MANAGER',
    description: 'Manages stores processing, stock verification, and material allocation',
    permissions: [
      'indent.view',
      'inventory.view',
      'inventory.issue',
      'materials.view',
      'production.view',
    ],
  },
  {
    id: 'role-4',
    roleName: 'ACCOUNTS_EXECUTIVE',
    description: 'Verifies financial cost sheets, variance limits, and financial closures',
    permissions: ['costsheet.view', 'costsheet.create', 'costsheet.update', 'reports.view'],
  },
  {
    id: 'role-5',
    roleName: 'DESIGN_ENGINEER',
    description: 'Creates indent specifications, CAD drawings, and process routings',
    permissions: ['indent.create', 'indent.view', 'indent.edit', 'manufacturing-processes.view'],
  },
];

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleData[]>(INITIAL_ROLES);
  const [search, setSearch] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [detailRole, setDetailRole] = useState<RoleData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleData | null>(null);

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const term = search.toLowerCase();
    return roles.filter(
      (r) => r.roleName.toLowerCase().includes(term) || r.description.toLowerCase().includes(term),
    );
  }, [roles, search]);

  const handleSaveRole = async (roleData: RoleData) => {
    if (roleData.id) {
      setRoles((prev) => prev.map((r) => (r.id === roleData.id ? roleData : r)));
    } else {
      const newRole: RoleData = {
        ...roleData,
        id: `role-${Date.now()}`,
      };
      setRoles((prev) => [newRole, ...prev]);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Role & Authority Management
          </h1>
          <p className="text-xs text-text-muted">
            Configure enterprise RBAC security roles, permission matrices, and access control scopes
          </p>
        </div>
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
      </div>

      {/* Toolbar & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface-card border border-border-default rounded-xl p-4 shadow-card">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Search size={16} />
          </div>
          <Input
            id="roleSearch"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      {/* Roles Grid */}
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
                    <span className="text-[10px] text-text-muted font-semibold">ID: {role.id}</span>
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
                <button
                  onClick={() => {
                    setEditingRole(role);
                    setFormModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary transition-colors"
                  title="Edit Role & Permissions"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setDeleteTarget(role)}
                  className="p-1.5 rounded-lg text-status-error/80 hover:text-status-error hover:bg-status-error/10 transition-colors"
                  title="Delete Role"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals & Dialogs */}
      <RoleFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleSaveRole}
        initialData={editingRole}
      />

      <RoleDetailModal
        isOpen={Boolean(detailRole)}
        onClose={() => setDetailRole(null)}
        role={detailRole}
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
