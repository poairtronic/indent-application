import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

interface MenuOption {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  options: MenuOption[];
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, options, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const toggleMenu = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClose = () => setIsOpen(false);
    if (isOpen) {
      window.addEventListener('click', handleClose);
      window.addEventListener('resize', handleClose);
    }
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('resize', handleClose);
    };
  }, [isOpen]);

  return (
    <div ref={triggerRef} className={`inline-block ${className}`}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          toggleMenu();
        }}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            style={{ top: coords.top + 6, left: coords.left }}
            className="absolute bg-surface-card border border-border-default rounded-lg shadow-dropdown py-1 z-[100] min-w-40 font-sans text-xs font-semibold text-text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  opt.onClick();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-background-secondary transition-colors focus:outline-none ${
                  opt.danger ? 'text-status-error hover:bg-status-error/10' : ''
                }`}
              >
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};

interface ContextMenuProps {
  children: React.ReactNode;
  options: MenuOption[];
  className?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ children, options, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setCoords({
      top: e.pageY,
      left: e.pageX,
    });
    setIsOpen(true);
  };

  useEffect(() => {
    const handleClose = () => setIsOpen(false);
    if (isOpen) {
      window.addEventListener('click', handleClose);
    }
    return () => {
      window.removeEventListener('click', handleClose);
    };
  }, [isOpen]);

  return (
    <div onContextMenu={handleContextMenu} className={className}>
      {children}

      {isOpen &&
        createPortal(
          <div
            style={{ top: coords.top, left: coords.left }}
            className="absolute bg-surface-card border border-border-default rounded-lg shadow-dropdown py-1 z-[100] min-w-40 font-sans text-xs font-semibold text-text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  opt.onClick();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-background-secondary transition-colors focus:outline-none ${
                  opt.danger ? 'text-status-error hover:bg-status-error/10' : ''
                }`}
              >
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};

export const ActionMenu: React.FC<{ options: MenuOption[]; className?: string }> = ({
  options,
  className = '',
}) => {
  return (
    <DropdownMenu
      options={options}
      className={className}
      trigger={
        <button
          type="button"
          className="p-1.5 rounded-lg border border-border-default bg-surface-card text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-all focus:outline-none"
        >
          <MoreVertical size={14} />
        </button>
      }
    />
  );
};
