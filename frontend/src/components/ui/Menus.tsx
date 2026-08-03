import React, { useState, useRef, useEffect, useId } from 'react';
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
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const menuId = useId();

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
    if (isOpen) {
      setFocusedIndex(0);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < options.length) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, options.length]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.querySelector<HTMLElement>('[role="button"]')?.focus();
      e.preventDefault();
      e.stopPropagation();
    } else if (e.key === 'ArrowDown') {
      setFocusedIndex((prev) => (prev + 1) % options.length);
      e.preventDefault();
      e.stopPropagation();
    } else if (e.key === 'ArrowUp') {
      setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
      e.preventDefault();
      e.stopPropagation();
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={triggerRef} className={`inline-block ${className}`} onKeyDown={handleKeyDown}>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          toggleMenu();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
          }
        }}
        className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-sm"
      >
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            id={menuId}
            role="menu"
            style={{ top: coords.top + 6, left: coords.left }}
            className="absolute bg-surface-card border border-border-default rounded-lg shadow-dropdown py-1 z-[100] min-w-40 font-sans text-xs font-semibold text-text-primary outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((opt, idx) => (
              <button
                key={idx}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                role="menuitem"
                type="button"
                tabIndex={focusedIndex === idx ? 0 : -1}
                onClick={() => {
                  opt.onClick();
                  setIsOpen(false);
                  triggerRef.current?.querySelector<HTMLElement>('[role="button"]')?.focus();
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-background-secondary transition-colors focus:bg-background-secondary focus:outline-none ${
                  opt.danger
                    ? 'text-status-error hover:bg-status-error/10 focus:bg-status-error/10'
                    : ''
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
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuId = useId();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setCoords({
      top: e.pageY,
      left: e.pageX,
    });
    setIsOpen(true);
  };

  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < options.length) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, options.length]);

  useEffect(() => {
    const handleClose = () => setIsOpen(false);
    if (isOpen) {
      window.addEventListener('click', handleClose);
    }
    return () => {
      window.removeEventListener('click', handleClose);
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      setIsOpen(false);
      e.preventDefault();
      e.stopPropagation();
    } else if (e.key === 'ArrowDown') {
      setFocusedIndex((prev) => (prev + 1) % options.length);
      e.preventDefault();
      e.stopPropagation();
    } else if (e.key === 'ArrowUp') {
      setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
      e.preventDefault();
      e.stopPropagation();
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div onContextMenu={handleContextMenu} className={className} onKeyDown={handleKeyDown}>
      {children}

      {isOpen &&
        createPortal(
          <div
            id={menuId}
            role="menu"
            style={{ top: coords.top, left: coords.left }}
            className="absolute bg-surface-card border border-border-default rounded-lg shadow-dropdown py-1 z-[100] min-w-40 font-sans text-xs font-semibold text-text-primary outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((opt, idx) => (
              <button
                key={idx}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                role="menuitem"
                type="button"
                tabIndex={focusedIndex === idx ? 0 : -1}
                onClick={() => {
                  opt.onClick();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-background-secondary transition-colors focus:bg-background-secondary focus:outline-none ${
                  opt.danger
                    ? 'text-status-error hover:bg-status-error/10 focus:bg-status-error/10'
                    : ''
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
          aria-label="Actions menu"
          className="p-1.5 rounded-lg border border-border-default bg-surface-card text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
        >
          <MoreVertical size={14} />
        </button>
      }
    />
  );
};
