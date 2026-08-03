import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-40 transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-surface-card border-l border-border-strong shadow-2xl z-50 flex flex-col font-sans animate-drawer-in">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-border-default">
          <div>
            <h2 className="text-base font-bold text-text-primary tracking-tight">{title}</h2>
            {description && <p className="text-xs text-text-muted mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-background-secondary transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {footer && (
          <div className="p-6 border-t border-border-default flex justify-end gap-3 bg-background-secondary">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};
