import React from 'react';
import { Pencil, PowerOff, Trash2, Phone, Building2, ShieldCheck } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge, statusLabel, statusTone } from '../../components/ui/Badge';
import { formatDateTime } from '../../utils/date';
import type { UserResponse } from '../../types/user';

interface UserDetailModalProps {
  open: boolean;
  user: UserResponse | null;
  canUpdate: boolean;
  canStatus: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (user: UserResponse) => void;
  onStatusChange: (user: UserResponse) => void;
  onDelete: (user: UserResponse) => void;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 border-b border-border-default last:border-0">
    <span className="text-xs font-semibold uppercase tracking-wide text-text-muted sm:w-36 shrink-0">
      {label}
    </span>
    <span className="text-sm text-text-primary break-words">{value || '-'}</span>
  </div>
);

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  open,
  user,
  canUpdate,
  canStatus,
  canDelete,
  onClose,
  onEdit,
  onStatusChange,
  onDelete,
}) => {
  if (!user) return null;

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="User Details"
      description={fullName}
      size="md"
      footer={
        <>
          {canStatus && (
            <Button
              variant="secondary"
              icon={<PowerOff size={14} />}
              onClick={() => onStatusChange(user)}
            >
              {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </Button>
          )}
          {canUpdate && (
            <Button variant="primary" icon={<Pencil size={14} />} onClick={() => onEdit(user)}>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" icon={<Trash2 size={14} />} onClick={() => onDelete(user)}>
              Delete
            </Button>
          )}
        </>
      }
    >
      <div className="flex items-center gap-4 pb-4 border-b border-border-default">
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt={fullName}
            className="w-14 h-14 rounded-full object-cover ring-1 ring-border-default"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-semibold text-lg ring-1 ring-border-default">
            {initials}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-text-primary">{fullName}</span>
            <Badge tone={statusTone[user.status]}>{statusLabel[user.status]}</Badge>
          </div>
          <div className="text-sm text-text-muted">{user.employeeCode}</div>
        </div>
      </div>

      <div className="mt-3">
        <DetailRow label="Email" value={user.email} />
        <DetailRow
          label="Phone"
          value={
            user.phone ? (
              <span className="inline-flex items-center gap-1.5">
                <Phone size={13} className="text-text-muted" /> {user.phone}
              </span>
            ) : (
              '-'
            )
          }
        />
        <DetailRow
          label="Department"
          value={
            user.departmentName ? (
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={13} className="text-text-muted" /> {user.departmentName}
              </span>
            ) : (
              '-'
            )
          }
        />
        <DetailRow
          label="Role"
          value={
            user.roleName ? (
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-text-muted" /> {user.roleName}
              </span>
            ) : (
              '-'
            )
          }
        />
        <DetailRow
          label="Last Login"
          value={user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
        />
        <DetailRow label="Created" value={formatDateTime(user.createdAt)} />
        <DetailRow label="Last Updated" value={formatDateTime(user.updatedAt)} />
      </div>
    </Modal>
  );
};
