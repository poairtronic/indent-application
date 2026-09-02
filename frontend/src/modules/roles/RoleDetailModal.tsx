import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Shield, Lock, Users } from 'lucide-react';
import type { RoleData } from './RoleFormModal';

interface RoleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleData | null;
  userCount?: number;
}

export const RoleDetailModal: React.FC<RoleDetailModalProps> = ({
  isOpen,
  onClose,
  role,
  userCount = 0,
}) => {
  if (!role) return null;

  const permissionsList = (role.permissions || [])
    .map((perm: any) =>
      typeof perm === 'string' ? perm : perm?.code || perm?.name || perm?.id || '',
    )
    .filter(Boolean);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Role Specification: ${role.roleName}`}
      description="Detailed RBAC authority scopes and assigned user metrics"
      size="lg"
    >
      <div className="space-y-5 font-sans text-xs">
        <div className="bg-surface-card border border-border-default rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm text-text-primary">{role.roleName}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-text-muted">
                <Users size={14} /> {userCount} Users Assigned
              </span>
              <Badge tone="blue">{permissionsList.length} Scope Tokens</Badge>
            </div>
          </div>
          <p className="text-text-secondary">{role.description || 'No description provided.'}</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Shield size={14} className="text-accent-primary" />
            <span>Assigned Permission Tokens</span>
          </h4>

          <div className="max-h-[260px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-1">
            {permissionsList.length > 0 ? (
              permissionsList.map((permCode) => (
                <div
                  key={permCode}
                  className="p-2.5 bg-background-primary/50 border border-border-default rounded-lg flex items-center gap-2 text-text-primary font-mono text-[11px]"
                >
                  <Lock size={12} className="text-accent-primary shrink-0" />
                  <span className="truncate">{permCode}</span>
                </div>
              ))
            ) : (
              <p className="text-text-muted col-span-2 py-4 text-center">
                No permissions assigned.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
