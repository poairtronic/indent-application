import React, { useState } from 'react';
import { Plus, Minus, Star } from 'lucide-react';
import { Chip } from './Chip';

interface TagsInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
}

export const TagsInput: React.FC<TagsInputProps> = ({
  label,
  tags,
  onChange,
  placeholder = 'Type tag and press Enter...',
  error,
}) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const clean = input.trim();
      if (clean && !tags.includes(clean)) {
        onChange([...tags, clean]);
        setInput('');
      }
    }
  };

  const handleRemove = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="w-full font-sans text-xs">
      {label && (
        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="space-y-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-background-primary border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary ${
            error ? 'border-status-error' : 'border-border-default'
          }`}
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <Chip key={tag} label={tag} onRemove={() => handleRemove(tag)} />
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-[10px] text-status-error font-medium">{error}</p>}
    </div>
  );
};

interface StepperProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  error?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 9999,
  error,
}) => {
  return (
    <div className="font-sans text-xs">
      {label && (
        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="p-2 border border-border-default rounded-lg bg-background-secondary text-text-primary hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none"
        >
          <Minus size={12} />
        </button>
        <span className="w-12 text-center text-xs font-bold text-text-primary">{value}</span>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="p-2 border border-border-default rounded-lg bg-background-secondary text-text-primary hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none"
        >
          <Plus size={12} />
        </button>
      </div>
      {error && <p className="mt-1 text-[10px] text-status-error font-medium">{error}</p>}
    </div>
  );
};

interface SliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  error,
}) => {
  return (
    <div className="w-full font-sans text-xs">
      <div className="flex justify-between items-center mb-1.5">
        {label && (
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
            {label}
          </label>
        )}
        <span className="text-xs font-bold text-text-primary">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-background-primary rounded-lg appearance-none cursor-pointer accent-accent-primary"
      />
      {error && <p className="mt-1 text-[10px] text-status-error font-medium">{error}</p>}
    </div>
  );
};

interface RatingProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  error?: string;
}

export const Rating: React.FC<RatingProps> = ({ label, value, onChange, max = 5, error }) => {
  return (
    <div className="font-sans text-xs">
      {label && (
        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="flex items-center gap-1">
        {Array.from({ length: max }).map((_, idx) => {
          const starVal = idx + 1;
          const isFilled = starVal <= value;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(starVal)}
              className="focus:outline-none transition-colors text-text-muted hover:text-status-warning"
            >
              <Star
                size={16}
                className={isFilled ? 'fill-status-warning text-status-warning' : 'text-text-muted'}
              />
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-[10px] text-status-error font-medium">{error}</p>}
    </div>
  );
};

export const SignaturePlaceholder: React.FC<{ label?: string }> = ({
  label = 'Authorized Signature',
}) => {
  return (
    <div className="w-full font-sans text-xs">
      <span className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
        {label}
      </span>
      <div className="border border-border-default rounded-xl h-24 bg-background-secondary flex flex-col items-center justify-center text-text-muted border-dashed p-4 select-none">
        <p className="font-bold text-[10px] uppercase tracking-wider">Signing Canvas Placeholder</p>
        <p className="text-[9px] mt-1">
          (Authorization Signatures auto-embedded on Cost Verification Approval)
        </p>
      </div>
    </div>
  );
};

interface RichTextProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const RichTextEditorWrapper: React.FC<RichTextProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Add formatted cost justification details...',
  error,
}) => {
  return (
    <div className="w-full font-sans text-xs">
      {label && (
        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="border border-border-default rounded-xl overflow-hidden bg-surface-card flex flex-col">
        <div className="flex gap-1 p-2 bg-background-secondary border-b border-border-default text-text-muted font-bold text-[10px] select-none">
          <button type="button" className="px-2 py-0.5 hover:bg-surface-elevated rounded">
            B
          </button>
          <button type="button" className="px-2 py-0.5 hover:bg-surface-elevated rounded italic">
            I
          </button>
          <button type="button" className="px-2 py-0.5 hover:bg-surface-elevated rounded underline">
            U
          </button>
          <div className="w-px h-4 bg-border-default mx-1" />
          <button type="button" className="px-2 py-0.5 hover:bg-surface-elevated rounded">
            Bullet List
          </button>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-2 text-xs text-text-primary outline-none min-h-[90px] resize-y"
        />
      </div>
      {error && <p className="mt-1 text-[10px] text-status-error font-medium">{error}</p>}
    </div>
  );
};
