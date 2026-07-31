import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDateTime } from '../../utils/date';
import type { UnitResponse } from '../../types/unit';

interface UnitDetailModalProps {
  open: boolean;
  unit: UnitResponse | null;
  canUpdate: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (unit: UnitResponse) => void;
  onDelete: (unit: UnitResponse) => void;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:w-36 shrink-0">
      {label}
    </span>
    <span className="text-sm text-gray-900 dark:text-white break-words">{value || '-'}</span>
  </div>
);

export const UnitDetailModal: React.FC<UnitDetailModalProps> = ({
  open,
  unit,
  canUpdate,
  canDelete,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!unit) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Unit Details"
      description={unit.unitName}
      size="md"
      footer={
        <>
          {canUpdate && (
            <Button variant="primary" icon={<Pencil size={14} />} onClick={() => onEdit(unit)}>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" icon={<Trash2 size={14} />} onClick={() => onDelete(unit)}>
              Delete
            </Button>
          )}
        </>
      }
    >
      <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-semibold text-lg">
          {unit.unitCode.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              {unit.unitName}
            </span>
            <Badge tone="blue">{unit.symbol}</Badge>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{unit.unitCode}</div>
        </div>
      </div>

      <div className="mt-3">
        <DetailRow label="Unit Code" value={unit.unitCode} />
        <DetailRow label="Unit Name" value={unit.unitName} />
        <DetailRow label="Symbol" value={unit.symbol} />
        <DetailRow label="Created" value={formatDateTime(unit.createdAt)} />
        <DetailRow label="Last Updated" value={formatDateTime(unit.updatedAt)} />
      </div>
    </Modal>
  );
};
