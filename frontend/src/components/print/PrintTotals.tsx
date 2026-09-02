import React from 'react';

export interface TotalRow {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface PrintTotalsProps {
  rows: TotalRow[];
  notes?: string;
  className?: string;
}

export const PrintTotals: React.FC<PrintTotalsProps> = ({ rows, notes, className = '' }) => {
  if (!rows || rows.length === 0) return null;

  return (
    <div
      className={`flex flex-col md:flex-row justify-between items-start gap-4 mb-6 print-break-inside-avoid ${className}`}
    >
      {/* Left side notes if any */}
      <div className="flex-1 text-xs text-gray-500">
        {notes && (
          <div className="border-l-2 border-gray-300 pl-2">
            <span className="font-semibold text-gray-700 block text-[9px] uppercase">Notes:</span>
            <p className="mt-0.5">{notes}</p>
          </div>
        )}
      </div>

      {/* Right side totals card */}
      <div className="w-full md:w-72 bg-gray-50 border border-gray-200 rounded p-3 text-xs">
        <div className="space-y-1.5 divide-y divide-gray-200">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className={`flex justify-between items-center ${idx > 0 ? 'pt-1.5' : ''} ${
                row.highlight ? 'font-bold text-gray-950 text-sm' : 'text-gray-700'
              }`}
            >
              <span>{row.label}</span>
              <span className="font-mono">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
