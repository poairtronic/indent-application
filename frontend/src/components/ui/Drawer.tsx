import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

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
  const titleId = useId();
  const descId = `${titleId}-desc`;
  const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen);

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
        className="fixed inset-0 bg-overlay backdrop-blur-[4px] z-40 transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={focusTrapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-surface-card border-l border-border-strong shadow-modal z-50 flex flex-col font-sans animate-drawer-in outline-none"
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-border-default">
          <div>
            <h2 id={titleId} className="text-base font-bold text-text-primary tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-xs text-text-muted mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-background-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            aria-label="Close drawer"
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
