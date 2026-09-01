import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
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
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (onBlur) {
          onBlur();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onBlur]);

  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.value.toLowerCase().includes(inputValue.toLowerCase()),
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Input
          {...props}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
              setIsOpen(!isOpen);
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 focus:outline-none"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {isOpen && !disabled && (
        <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-background-primary border border-border-default rounded-md shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <li
                key={`${option.value}-${idx}`}
                className="px-3 py-2 text-xs cursor-pointer hover:bg-accent-primary/10 hover:text-accent-primary text-text-primary transition-colors"
                onClick={() => {
                  setInputValue(option.value);
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-xs text-text-muted italic">
              Press enter to use "{inputValue}" or type a different vendor.
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
