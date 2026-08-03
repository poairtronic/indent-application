import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface AutocompleteOption {
  label: string;
  value: string;
}

interface AutocompleteProps {
  label?: string;
  options: AutocompleteOption[];
  selectedValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  label,
  options,
  selectedValue,
  onChange,
  placeholder = 'Select or search option...',
  error,
  helperText,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === selectedValue);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearch(selectedOption ? selectedOption.label : '');
    }
  }, [isOpen, selectedOption]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`w-full font-sans text-xs relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          className={`w-full bg-background-primary border rounded-lg pl-8 pr-16 py-2 text-xs text-text-primary placeholder:text-text-disabled outline-none transition-all duration-150 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/25 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-status-error focus:ring-status-error/25' : 'border-border-default'
          }`}
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <Search size={14} className="absolute left-2.5 top-2.5 text-text-muted" />

        <div className="absolute right-2.5 top-2 flex items-center gap-1">
          {selectedValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-text-muted hover:text-text-primary focus:outline-none"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-text-muted hover:text-text-primary focus:outline-none"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 w-full mt-1 bg-surface-card border border-border-default rounded-lg shadow-dropdown py-1 z-30 max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-text-muted text-center">No matches found</div>
          ) : (
            filtered.map((opt) => {
              const isSel = opt.value === selectedValue;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-2 hover:bg-background-secondary transition-colors focus:outline-none ${
                    isSel
                      ? 'text-accent-primary font-bold bg-accent-primary/5'
                      : 'text-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })
          )}
        </div>
      )}

      {error && <p className="mt-1 text-[10px] text-status-error font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-[10px] text-text-muted">{helperText}</p>}
    </div>
  );
};
