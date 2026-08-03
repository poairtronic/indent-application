import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { formatDateTime } from '../../utils/date';
import type { DeletedRecordInfo } from '../../hooks/useDeletedRecords';

interface DeletedRecordsModalProps {
  open: boolean;
  title: string;
  records: DeletedRecordInfo[];
  loadingId: string | null;
  onClose: () => void;
  onRestore: (id: string) => void;
}

export const DeletedRecordsModal: React.FC<DeletedRecordsModalProps> = ({
  open,
  title,
  records,
  loadingId,
  onClose,
  onRestore,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Recently deleted records can be restored here. Records soft-deleted before this browser session require the record ID."
      size="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {records.length === 0 ? (
        <EmptyState
          title="No deleted records"
          description="Records you soft-delete during this session will appear here so you can restore them."
        />
      ) : (
        <ul className="divide-y divide-border-default">
          {records.map((record) => (
            <li key={record.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">
                  {record.summary}
                </div>
                <div className="text-xs text-text-muted">
                  Deleted {formatDateTime(record.deletedAt)}
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<RotateCcw size={14} />}
                loading={loadingId === record.id}
                onClick={() => onRestore(record.id)}
              >
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};
