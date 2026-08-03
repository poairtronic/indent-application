import React, { useState, useRef, useEffect } from 'react';
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
    if (isOpen) {
      document.addEventListener('mousedown', clickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', clickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={triggerRef} className={`relative inline-block ${className}`}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          togglePopover();
        }}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            style={{ top: coords.top + 6, left: coords.left }}
            className="absolute bg-surface-card border border-border-default rounded-xl shadow-xl p-4 z-[90] min-w-56 font-sans text-xs text-text-primary"
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

  const handleMouseEnter = () => {
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsOpen(false)}
      className={`inline-block ${className}`}
    >
      {trigger}

      {isOpen &&
        createPortal(
          <div
            style={{ top: coords.top + 6, left: coords.left }}
            className="absolute bg-surface-card border border-border-default rounded-xl shadow-xl p-4 z-[90] min-w-56 font-sans text-xs text-text-primary pointer-events-none"
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
};
