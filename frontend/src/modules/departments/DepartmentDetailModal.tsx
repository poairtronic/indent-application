import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Building2, User, Users } from 'lucide-react';
import type { DepartmentData } from './DepartmentFormModal';

interface DepartmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: DepartmentData | null;
}

export const DepartmentDetailModal: React.FC<DepartmentDetailModalProps> = ({
  isOpen,
  onClose,
  department,
}) => {
  if (!department) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Department Details: ${department.departmentName}`}
      description="Organizational structure and operating members"
      size="md"
    >
      <div className="space-y-4 font-sans text-xs">
        <div className="bg-surface-card border border-border-default rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                <Building2 size={18} />
              </div>
              <div>
                <span className="font-bold text-sm text-text-primary block">
                  {department.departmentName}
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  CODE: {department.departmentCode}
                </span>
              </div>
            </div>

            <Badge tone={department.isActive ? 'green' : 'gray'}>
              {department.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 border-t border-border-default/50 pt-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-muted flex items-center gap-1.5 font-medium">
              <User size={14} className="text-accent-primary" /> Head of Department (HOD):
            </span>
            <span className="font-bold text-text-primary">
              {department.headOfDepartment || 'Unassigned'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-text-muted flex items-center gap-1.5 font-medium">
              <Users size={14} className="text-accent-primary" /> Assigned Personnel:
            </span>
            <span className="font-bold text-text-primary">
              {department.memberCount ?? '—'} Members
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
