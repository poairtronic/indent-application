import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { Input, type InputProps } from './Input';

export interface ComboboxOption {
  label: string;
  value: string;
}

export interface ComboboxProps extends Omit<InputProps, 'onChange' | 'value'> {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  onBlur,
  disabled,
  placeholder,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Synchronize internal input value when prop `value` changes from parent
  useEffect(() => {
    setInputValue(value || '');
    setIsSearching(false);
  }, [value]);

  // Handle clicking outside the combobox container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsSearching(false);
        // If user typed without selecting, restore input to committed value
        setInputValue(value || '');
        if (onBlur) {
          onBlur();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [value, onBlur]);

  // Compute filtered options. When not actively searching, show all options.
  const filteredOptions = useMemo(() => {
    if (!isSearching || !inputValue.trim()) {
      return options;
    }
    const query = inputValue.trim().toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query),
    );
  }, [options, isSearching, inputValue]);

  // Scroll active item into view during keyboard navigation
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && itemRefs.current[activeIndex]) {
      if (typeof itemRefs.current[activeIndex]?.scrollIntoView === 'function') {
        itemRefs.current[activeIndex]?.scrollIntoView({
          block: 'nearest',
        });
      }
    }
  }, [activeIndex, isOpen]);

  // When dropdown opens, highlight existing selection if available
  useEffect(() => {
    if (isOpen) {
      if (value) {
        const foundIdx = filteredOptions.findIndex(
          (opt) => opt.value.toLowerCase() === value.toLowerCase(),
        );
        setActiveIndex(foundIdx >= 0 ? foundIdx : -1);
      } else {
        setActiveIndex(-1);
      }
    } else {
      setActiveIndex(-1);
    }
  }, [isOpen]);

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    setIsSearching(false);
    onChange(selectedValue);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue('');
    setIsSearching(false);
    onChange('');
    setIsOpen(true);
    setActiveIndex(0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setIsSearching(false);
        setActiveIndex(0);
      } else if (filteredOptions.length > 0) {
        setActiveIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setIsSearching(false);
        setActiveIndex(filteredOptions.length - 1);
      } else if (filteredOptions.length > 0) {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
      }
    } else if (e.key === 'Enter') {
      if (isOpen) {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelect(filteredOptions[activeIndex].value);
        } else if (filteredOptions.length === 1) {
          handleSelect(filteredOptions[0].value);
        } else if (inputValue.trim()) {
          handleSelect(inputValue.trim());
        }
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setIsSearching(false);
        setInputValue(value || '');
      }
    } else if (e.key === 'Tab') {
      setIsOpen(false);
      setIsSearching(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Input
          {...props}
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            const nextVal = e.target.value;
            setInputValue(nextVal);
            setIsSearching(true);
            onChange(nextVal);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={(e) => {
            if (!disabled) {
              setIsOpen(true);
              setIsSearching(false);
              e.currentTarget.select();
            }
          }}
          onClick={() => {
            if (!disabled && !isOpen) {
              setIsOpen(true);
              setIsSearching(false);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`pr-16 ${className}`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
          {!disabled && inputValue && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear selection"
              onClick={handleClear}
              className="text-text-muted hover:text-text-primary p-1 focus:outline-none rounded hover:bg-surface-hover transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Toggle dropdown list"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                if (isOpen) {
                  setIsOpen(false);
                  setIsSearching(false);
                } else {
                  setIsOpen(true);
                  setIsSearching(false);
                  inputRef.current?.focus();
                }
              }
            }}
            className="text-text-muted hover:text-text-primary p-1 focus:outline-none rounded hover:bg-surface-hover transition-colors"
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <ul
          role="listbox"
          className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-background-primary border border-border-default rounded-lg shadow-xl py-1 divide-y divide-border-default/20 animate-in fade-in-50 duration-100"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => {
              const isSelected =
                Boolean(value) && option.value.toLowerCase() === value.toLowerCase();
              const isHighlighted = idx === activeIndex;

              return (
                <li
                  key={`${option.value}-${idx}`}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  role="option"
                  aria-selected={isSelected}
                  className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-accent-primary/15 text-accent-primary font-medium'
                      : isHighlighted
                        ? 'bg-accent-primary/10 text-accent-primary'
                        : 'text-text-primary hover:bg-surface-hover'
                  }`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(option.value);
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isSelected ? (
                      <Check size={14} className="text-accent-primary flex-shrink-0" />
                    ) : (
                      <span className="w-3.5 flex-shrink-0" />
                    )}
                    <span className="truncate">{option.label}</span>
                  </div>
                </li>
              );
            })
          ) : (
            <li
              className="px-3 py-2.5 text-xs text-text-muted italic cursor-pointer hover:bg-surface-hover"
              onMouseDown={(e) => {
                if (inputValue.trim()) {
                  e.preventDefault();
                  handleSelect(inputValue.trim());
                }
              }}
            >
              {inputValue.trim()
                ? `No matching vendors found. Click or press Enter to use "${inputValue.trim()}" as a custom vendor.`
                : 'No vendors available in master catalog.'}
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
