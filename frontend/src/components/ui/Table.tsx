import React from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;

  // Sorting
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;

  // Selection
  selectedIds?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAllRows?: (selected: boolean) => void;
  getRowId?: (row: T) => string;

  // Pagination
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function Table<T>({
  columns,
  data,
  loading = false,
  error,
  emptyMessage = 'No records found in this data grid.',
  sortColumn,
  sortDirection,
  onSort,
  selectedIds = [],
  onSelectRow,
  onSelectAllRows,
  getRowId,
  page,
  totalPages,
  onPageChange,
}: TableProps<T>) {
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectAllRows?.(e.target.checked);
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className="font-sans w-full space-y-4">
      <div className="w-full bg-surface-card border border-border-default rounded-xl overflow-hidden shadow-card">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background-secondary border-b border-border-default h-11 text-xs text-text-muted font-bold select-none">
                {onSelectAllRows && (
                  <th className="w-12 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="h-3.5 w-3.5 rounded border border-border-default bg-background-primary text-accent-primary focus:ring-accent-primary outline-none transition-all cursor-pointer"
                    />
                  </th>
                )}

                {columns.map((col) => {
                  const isSorted = sortColumn === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && onSort?.(col.key)}
                      className={`px-4 py-3 text-xs font-semibold ${
                        col.sortable
                          ? 'cursor-pointer hover:text-text-primary transition-colors'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable && isSorted && (
                          <span>
                            {sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-accent-primary" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-accent-primary" />
                            )}
                          </span>
                        )}
                        {col.sortable && !isSorted && (
                          <ChevronsUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-border-default text-xs text-text-primary">
              {loading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={rIdx} className="h-12 animate-pulse bg-background-primary/10">
                    {onSelectAllRows && (
                      <td className="px-4 py-3">
                        <div className="w-4 h-4 bg-surface-elevated rounded mx-auto" />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="w-2/3 h-3.5 bg-surface-elevated rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td
                    colSpan={columns.length + (onSelectAllRows ? 1 : 0)}
                    className="p-8 text-center text-status-error font-medium"
                  >
                    ⚠️ {error}
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (onSelectAllRows ? 1 : 0)}
                    className="p-8 text-center text-text-secondary"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, rIdx) => {
                  const rowId = getRowId ? getRowId(row) : String(rIdx);
                  const isChecked = selectedIds.includes(rowId);

                  return (
                    <tr
                      key={rowId}
                      className={`h-11 hover:bg-background-secondary transition-colors ${
                        isChecked ? 'bg-accent-primary/5' : ''
                      }`}
                    >
                      {onSelectRow && (
                        <td className="px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onSelectRow(rowId)}
                            className="h-3.5 w-3.5 rounded border border-border-default bg-background-primary text-accent-primary focus:ring-accent-primary outline-none transition-all cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 font-medium">
                          {col.render ? col.render(row) : (row as any)[col.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {page && totalPages && onPageChange && (
        <div className="flex items-center justify-between font-sans text-xs px-2 select-none">
          <span className="text-text-muted">
            Page <span className="font-semibold text-text-primary">{page}</span> of{' '}
            <span className="font-semibold text-text-primary">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-border-default bg-surface-card text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-border-default bg-surface-card text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-1"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
