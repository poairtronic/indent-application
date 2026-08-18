import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { menuItems, settingsMenuItems } from '../../config/menuConfig';
import { useAuthStore } from '../../store/authStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems = [...menuItems, ...settingsMenuItems];

  const filtered = allItems
    .filter((item) => !item.permission || hasPermission(item.permission))
    .filter(
      (item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.path.toLowerCase().includes(query.toLowerCase()),
    );

  const handleSelect = useCallback(
    (path: string) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose],
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex].path);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, filtered, selectedIndex, handleSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 font-sans">
      <div className="fixed inset-0 bg-overlay transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-surface-card border border-border-default rounded-xl shadow-modal overflow-hidden flex flex-col max-h-[400px]">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-border-default gap-3 bg-surface-elevated">
          <Search className="w-5 h-5 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type page name or path to navigate..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-text-primary placeholder-text-muted outline-none border-none"
          />
          <kbd className="text-[10px] bg-background-secondary border border-border-default text-text-muted px-2 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-xs">No matching pages found.</div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left focus:outline-none ${
                    isSelected
                      ? 'bg-accent-primary text-white'
                      : 'text-text-secondary hover:bg-background-secondary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">🧭</span>
                    <div>
                      <p className={isSelected ? 'text-white' : 'text-text-primary'}>
                        {item.label}
                      </p>
                      <p
                        className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-text-muted'}`}
                      >
                        {item.path}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border-default bg-background-secondary flex items-center justify-between text-[10px] text-text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="bg-surface-card border border-border-default px-1 rounded">↑↓</kbd>{' '}
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-surface-card border border-border-default px-1 rounded">Enter</kbd>{' '}
              Open
            </span>
          </div>
          <span>Enterprise Portal Command Console</span>
        </div>
      </div>
    </div>
  );
};
