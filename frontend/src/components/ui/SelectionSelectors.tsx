import React from 'react';
import { Select } from './Select';

interface SelectorOption {
  label: string;
  value: string;
}

interface CheckboxGroupProps {
  label?: string;
  options: SelectorOption[];
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  options,
  values,
  onChange,
  error,
}) => {
  const handleToggle = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  return (
    <div className="w-full font-sans text-xs">
      {label && (
        <span className="block text-xs font-semibold text-text-secondary mb-2.5 uppercase tracking-wide">
          {label}
        </span>
      )}
      <div className="space-y-2">
        {options.map((opt) => {
          const isChecked = values.includes(opt.value);
          return (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggle(opt.value)}
                className="h-4 w-4 rounded border border-border-default bg-background-primary text-accent-primary focus:ring-accent-primary outline-none transition-all cursor-pointer"
              />
              <span className="text-xs font-semibold text-text-primary">{opt.label}</span>
            </label>
          );
        })}
      </div>
      {error && <p className="mt-1 text-[10px] text-status-error font-medium">{error}</p>}
    </div>
  );
};

interface RadioGroupProps {
  label?: string;
  options: SelectorOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  error?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  options,
  value,
  onChange,
  name,
  error,
}) => {
  return (
    <div className="w-full font-sans text-xs">
      {label && (
        <span className="block text-xs font-semibold text-text-secondary mb-2.5 uppercase tracking-wide">
          {label}
        </span>
      )}
      <div className="space-y-2">
        {options.map((opt) => {
          const isChecked = opt.value === value;
          return (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="radio"
                name={name}
                checked={isChecked}
                onChange={() => onChange(opt.value)}
                className="h-4 w-4 border border-border-default bg-background-primary text-accent-primary focus:ring-accent-primary outline-none cursor-pointer"
              />
              <span className="text-xs font-semibold text-text-primary">{opt.label}</span>
            </label>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-[10px] text-status-error font-medium">{error}</p>}
    </div>
  );
};

interface SelectorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const DepartmentSelector: React.FC<SelectorProps> = ({
  label = 'Department',
  value,
  onChange,
  error,
}) => {
  const departments = [
    { label: 'Select Department...', value: '' },
    { label: 'Design', value: 'DESIGN' },
    { label: 'Stores', value: 'STORES' },
    { label: 'Production', value: 'PRODUCTION' },
    { label: 'Accounts', value: 'ACCOUNTS' },
    { label: 'Management', value: 'MANAGEMENT' },
  ];

  return (
    <Select
      label={label}
      options={departments}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
    />
  );
};

export const RoleSelector: React.FC<SelectorProps> = ({
  label = 'User Role',
  value,
  onChange,
  error,
}) => {
  const roles = [
    { label: 'Select Role...', value: '' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'General Manager', value: 'GM' },
    { label: 'Senior Manager', value: 'SR_MGR' },
    { label: 'Officer', value: 'OFFICER' },
  ];

  return (
    <Select
      label={label}
      options={roles}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
    />
  );
};

export const PermissionSelector: React.FC<SelectorProps> = ({
  label = 'Permission Scope',
  value,
  onChange,
  error,
}) => {
  const permissions = [
    { label: 'Select Permission...', value: '' },
    { label: 'Read-Only (Viewer)', value: 'READ' },
    { label: 'Write-Only (Processor)', value: 'WRITE' },
    { label: 'Full Access (Owner)', value: 'FULL' },
  ];

  return (
    <Select
      label={label}
      options={permissions}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
    />
  );
};
