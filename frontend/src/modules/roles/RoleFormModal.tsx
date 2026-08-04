import React, { useState, useEffect } from 'react';
import { usePermissionModules, usePermissions } from '../../api/services/permissions/hooks';
import {
  useCreateRole,
  useUpdateRole,
  useRolePermissions,
  useUpdateRolePermissions,
} from '../../api/services/roles/hooks';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Modal } from '../../components/ui/Modal';
import { Shield, Check } from 'lucide-react';
import { useToasts } from '../../components/ui/toast';

export interface RoleData {
  id?: string;
  roleName: string;
  description: string;
  permissions: string[];
}

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (role: RoleData) => Promise<void>;
  initialData?: RoleData | null;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { show } = useToasts();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const updatePermissions = useUpdateRolePermissions();

  const isEditing = Boolean(initialData?.id);

  const { data: modules = [] } = usePermissionModules();
  const { data: allPermissions = [] } = usePermissions();
  const { data: rolePermissions } = useRolePermissions(initialData?.id ?? '');

  useEffect(() => {
    if (initialData) {
      setRoleName(initialData.roleName);
      setDescription(initialData.description || '');
      setSelectedPermissions(initialData.permissions || []);
    } else {
      setRoleName('');
      setDescription('');
      setSelectedPermissions([]);
    }
    setError(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isEditing && rolePermissions) {
      setSelectedPermissions(rolePermissions);
    }
  }, [isEditing, rolePermissions]);

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const toggleCategory = (modulePermissions: string[]) => {
    const allSelected = modulePermissions.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !modulePermissions.includes(p)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...modulePermissions])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setError('Role name is required');
      return;
    }
    setError(null);

    try {
      if (isEditing && initialData?.id) {
        await updateRole.mutateAsync({
          id: initialData.id,
          payload: { roleName: roleName.trim(), description: description.trim() },
        });
        const permissionIds = allPermissions
          .filter((p) => selectedPermissions.includes(p.code))
          .map((p) => p.id);
        await updatePermissions.mutateAsync({
          id: initialData.id,
          permissionIds,
        });
        show('success', `Role "${roleName}" updated successfully.`);
      } else {
        const created = await createRole.mutateAsync({
          roleName: roleName.trim(),
          description: description.trim(),
        });
        if (selectedPermissions.length > 0) {
          const permissionIds = allPermissions
            .filter((p) => selectedPermissions.includes(p.code))
            .map((p) => p.id);
          await updatePermissions.mutateAsync({
            id: created.id,
            permissionIds,
          });
        }
        show('success', `Role "${roleName}" created successfully.`);
      }
      await onSubmit({
        id: initialData?.id,
        roleName: roleName.trim(),
        description: description.trim(),
        permissions: selectedPermissions,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save role';
      setError(message);
    }
  };

  const groupedByModule = modules.map((mod) => ({
    module: mod,
    permissions: allPermissions.filter((p) => p.module === mod).map((p) => p.code),
  }));

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Role & Permissions' : 'Create New Role'}
      description="Define role identity and assign permission scopes"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 font-sans text-xs">
        {error && (
          <div className="p-3 bg-status-error/10 border border-status-error/20 rounded-lg text-status-error font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="roleName"
            label="Role Name"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="e.g. STORES_MANAGER"
            required
          />
          <TextArea
            id="description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief role responsibilities..."
            rows={2}
          />
        </div>

        <div className="space-y-3 pt-2 border-t border-border-default/50">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} className="text-accent-primary" />
              <span>Permission Scope Matrix</span>
            </h4>
            <span className="text-[10px] font-bold text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-full">
              {selectedPermissions.length} Permissions Selected
            </span>
          </div>

          <div className="max-h-[320px] overflow-y-auto space-y-4 pr-1">
            {groupedByModule.map(({ module: mod, permissions: perms }) => {
              const isAllSelected =
                perms.length > 0 && perms.every((p) => selectedPermissions.includes(p));

              return (
                <div
                  key={mod}
                  className="border border-border-default rounded-xl p-3 bg-background-primary/40 space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-border-default/40 pb-2">
                    <span className="font-bold text-xs text-text-primary capitalize">
                      {mod} Module
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCategory(perms)}
                      className="text-[10px] font-semibold text-accent-primary hover:underline"
                    >
                      {isAllSelected ? 'Deselect Category' : 'Select Category All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                    {perms.map((p) => {
                      const isSelected = selectedPermissions.includes(p);
                      return (
                        <label
                          key={p}
                          onClick={() => togglePermission(p)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] cursor-pointer select-none transition-colors ${
                            isSelected
                              ? 'bg-accent-primary/10 border-accent-primary/30 text-text-primary font-semibold'
                              : 'bg-surface-card border-border-default text-text-muted hover:border-border-strong'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-accent-primary border-accent-primary text-white'
                                : 'border-border-default bg-background-primary'
                            }`}
                          >
                            {isSelected && <Check size={10} />}
                          </div>
                          <span className="truncate">{p}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-border-default/50">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={createRole.isPending || updateRole.isPending || updatePermissions.isPending}
            type="submit"
          >
            {isEditing ? 'Update Role' : 'Create Role'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
