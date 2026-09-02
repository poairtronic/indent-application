import React from 'react';

export interface PrintColumn<T = any> {
  header: string;
  accessor?: keyof T | ((row: T, index: number) => React.ReactNode);
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export interface PrintTableProps<T = any> {
  columns: PrintColumn<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
}

export function PrintTable<T = any>({
  columns,
  data,
  emptyMessage = 'No records found matching the specified criteria.',
  className = '',
}: PrintTableProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center border border-gray-200 rounded bg-gray-50 my-4 text-xs text-gray-500">
        <p className="font-medium text-gray-700">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-visible mb-6 ${className}`}>
      <table className="merc-print-table w-full border-collapse text-left">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{ width: col.width }}
                className={`py-1.5 px-2 text-[8pt] font-bold uppercase tracking-wider text-gray-700 bg-gray-100 border-t border-b-2 border-gray-300 ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`print-break-inside-avoid ${rowIdx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}
            >
              {columns.map((col, colIdx) => {
                let cellValue: React.ReactNode = null;
                if (typeof col.accessor === 'function') {
                  cellValue = col.accessor(row, rowIdx);
                } else if (col.accessor) {
                  cellValue = (row as any)[col.accessor];
                }

                return (
                  <td
                    key={colIdx}
                    className={`py-1.5 px-2 text-[9pt] text-gray-800 border-b border-gray-200 ${
                      col.align === 'right'
                        ? 'text-right font-mono'
                        : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                    } ${col.className || ''}`}
                  >
                    {cellValue !== undefined && cellValue !== null && cellValue !== ''
                      ? cellValue
                      : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
