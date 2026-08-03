import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({ trigger, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const popoverId = useId();

  const togglePopover = () => {
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
    const clickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.querySelector<HTMLElement>('[role="button"]')?.focus();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', clickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', clickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={triggerRef} className={`relative inline-block ${className}`}>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          togglePopover();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            togglePopover();
          }
        }}
        className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-sm"
      >
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            id={popoverId}
            role="dialog"
            aria-modal="false"
            style={{ top: coords.top + 6, left: coords.left }}
            className="absolute bg-surface-card border border-border-default rounded-xl shadow-dropdown p-4 z-[90] min-w-56 font-sans text-xs text-text-primary outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
};

interface HoverCardProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const HoverCard: React.FC<HoverCardProps> = ({ trigger, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const hoverCardId = useId();

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setIsOpen(true);
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleOpen}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={handleOpen}
      onBlur={() => setIsOpen(false)}
      tabIndex={0}
      aria-haspopup="true"
      aria-expanded={isOpen}
      aria-describedby={isOpen ? hoverCardId : undefined}
      className={`inline-block outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-sm ${className}`}
    >
      {trigger}

      {isOpen &&
        createPortal(
          <div
            id={hoverCardId}
            role="tooltip"
            style={{ top: coords.top + 6, left: coords.left }}
            className="absolute bg-surface-card border border-border-default rounded-xl shadow-dropdown p-4 z-[90] min-w-56 font-sans text-xs text-text-primary pointer-events-none"
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
};
