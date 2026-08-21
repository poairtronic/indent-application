import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';

export const ShortcutHelper: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '?' &&
        (e.target as HTMLElement).tagName !== 'INPUT' &&
        (e.target as HTMLElement).tagName !== 'TEXTAREA'
      ) {
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shortcuts = [
    { keys: ['Ctrl', 'K'], desc: 'Toggle Command search palette' },
    { keys: ['Esc'], desc: 'Dismiss active Modals / Drawers' },
    { keys: ['Shift', '?'], desc: 'Open Keyboard Shortcuts helper' },
    { keys: ['Tab'], desc: 'Navigate forward between focus fields' },
    { keys: ['Shift', 'Tab'], desc: 'Navigate backward between focus fields' },
  ];

  return (
    <Modal
      open={isOpen}
      onClose={() => setIsOpen(false)}
      title="System Keyboard Shortcuts"
      description="Quickly navigate the MERC dashboard using keyboard key bindings."
    >
      <div className="font-sans text-xs space-y-3.5">
        {shortcuts.map((sc, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between border-b border-border-default/30 pb-2.5 last:border-0 last:pb-0"
          >
            <span className="text-text-secondary">{sc.desc}</span>
            <div className="flex gap-1">
              {sc.keys.map((k) => (
                <kbd
                  key={k}
                  className="px-2 py-1 rounded bg-background-secondary border border-border-default font-mono text-[10px] font-bold text-text-primary shadow-card"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
