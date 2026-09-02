import React from 'react';

export interface FilterItem {
  label: string;
  value?: string | number | null;
}

export interface PrintFiltersProps {
  filters: FilterItem[];
  className?: string;
}

export const PrintFilters: React.FC<PrintFiltersProps> = ({ filters, className = '' }) => {
  const activeFilters = filters.filter(
    (f) => f.value !== undefined && f.value !== null && f.value !== '' && f.value !== 'ALL',
  );

  return (
    <div className={`mb-4 print-break-inside-avoid text-xs ${className}`}>
      <div className="bg-gray-50 border border-gray-200 rounded px-3 py-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
          Report Filters:
        </span>
        {activeFilters.length === 0 ? (
          <span className="text-gray-700 font-medium">All Records (No Active Filter)</span>
        ) : (
          activeFilters.map((f, idx) => (
            <span key={idx} className="text-gray-800">
              <strong className="text-gray-600 font-semibold">{f.label}:</strong>{' '}
              <span className="font-medium">{String(f.value)}</span>
            </span>
          ))
        )}
      </div>
    </div>
  );
};
