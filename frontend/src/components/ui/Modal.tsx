import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) => {
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    if (open) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 bg-overlay backdrop-blur-[8px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${sizeClasses[size]} bg-surface-card border border-border-strong rounded-xl shadow-modal animate-scale-in`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border-default">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-bold text-text-primary tracking-tight">
              {title}
            </h2>
            {description && <p className="text-xs text-text-muted mt-1">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-background-secondary transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-border-default flex justify-end gap-3 bg-background-secondary/60 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
