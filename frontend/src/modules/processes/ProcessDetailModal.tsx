import React from 'react';
import { Pencil, Trash2, Package } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { formatDateTime } from '../../utils/date';
import { formatNumber } from '../../utils/format';
import type { ProcessResponse, ProcessStatus } from '../../types/process';

export const processStatusTone: Record<ProcessStatus, BadgeTone> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
};

export const processStatusLabel: Record<ProcessStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

interface ProcessDetailModalProps {
  open: boolean;
  process: ProcessResponse | null;
  canUpdate: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (process: ProcessResponse) => void;
  onDelete: (process: ProcessResponse) => void;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 border-b border-border-default last:border-0">
    <span className="text-xs font-semibold uppercase tracking-wide text-text-muted sm:w-36 shrink-0">
      {label}
    </span>
    <span className="text-sm text-text-primary break-words">{value || '-'}</span>
  </div>
);

export const ProcessDetailModal: React.FC<ProcessDetailModalProps> = ({
  open,
  process,
  canUpdate,
  canDelete,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!process) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Process Details"
      description={process.processName}
      size="md"
      footer={
        <>
          {canUpdate && (
            <Button variant="primary" icon={<Pencil size={14} />} onClick={() => onEdit(process)}>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" icon={<Trash2 size={14} />} onClick={() => onDelete(process)}>
              Delete
            </Button>
          )}
        </>
      }
    >
      <div className="flex items-center gap-4 pb-4 border-b border-border-default">
        <div className="w-14 h-14 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-semibold text-lg ring-1 ring-border-default">
          {process.processCode.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-text-primary">{process.processName}</span>
            <Badge tone={processStatusTone[process.status]}>
              {processStatusLabel[process.status]}
            </Badge>
          </div>
          <div className="text-sm text-text-muted">{process.processCode}</div>
        </div>
      </div>

      <div className="mt-3">
        <DetailRow
          label="Product"
          value={
            process.productCode ? (
              <span className="inline-flex items-center gap-1.5">
                <Package size={13} className="text-text-muted" /> {process.productCode}
              </span>
            ) : (
              process.productId
            )
          }
        />
        <DetailRow label="Product ID" value={process.productId} />
        <DetailRow label="Sequence" value={process.sequence} />
        <DetailRow label="Estimated Hours" value={`${formatNumber(process.estimatedHours)} hrs`} />
        <DetailRow label="Description" value={process.description || '-'} />
        <DetailRow label="Created" value={formatDateTime(process.createdAt)} />
        <DetailRow label="Last Updated" value={formatDateTime(process.updatedAt)} />
      </div>
    </Modal>
  );
};
