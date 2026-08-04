import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary' | 'success' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            tone === 'danger'
              ? 'bg-status-error/12'
              : tone === 'warning'
                ? 'bg-status-warning/12'
                : tone === 'success'
                  ? 'bg-status-success/12'
                  : 'bg-accent-primary/12'
          }`}
        >
          <AlertTriangle
            size={20}
            className={
              tone === 'danger'
                ? 'text-status-error'
                : tone === 'warning'
                  ? 'text-status-warning'
                  : tone === 'success'
                    ? 'text-status-success'
                    : 'text-accent-primary'
            }
          />
        </div>
        <div className="text-sm text-text-secondary">{message}</div>
      </div>
    </Modal>
  );
};
