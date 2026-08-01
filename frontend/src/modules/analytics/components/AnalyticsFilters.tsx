import React, { useState } from 'react';
import type { IAnalyticsFilters } from '../types/analytics.types';

interface AnalyticsFiltersProps {
  onApply: (filters: IAnalyticsFilters) => void;
  onReset: () => void;
  showLimit?: boolean;
}

export const FilterPanel: React.FC<AnalyticsFiltersProps> = ({
  onApply,
  onReset,
  showLimit = false,
}) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [limit, setLimit] = useState(50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: showLimit ? limit : undefined,
    });
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setLimit(50);
    onReset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl flex flex-wrap items-end gap-4 shadow-md"
    >
      <div className="flex flex-col gap-1.5 min-w-[180px]">
        <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          From Date
        </label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5 min-w-[180px]">
        <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          To Date
        </label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {showLimit && (
        <div className="flex flex-col gap-1.5 min-w-[100px]">
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Limit Size
          </label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value={10}>10 Items</option>
            <option value={25}>25 Items</option>
            <option value={50}>50 Items</option>
            <option value={100}>100 Items</option>
          </select>
        </div>
      )}

      <div className="flex gap-2 ml-auto">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors"
        >
          Reset
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </form>
  );
};
