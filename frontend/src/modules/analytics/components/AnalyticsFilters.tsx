import React, { useState } from 'react';
import type { IAnalyticsFilters } from '../types/analytics.types';
import { Button } from '../../../components/ui/Button';

interface AnalyticsFiltersProps {
  onApply: (filters: IAnalyticsFilters) => void;
  onReset: () => void;
  showLimit?: boolean;
}

export const FilterPanel = React.memo<AnalyticsFiltersProps>(
  ({ onApply, onReset, showLimit = false }) => {
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
        className="bg-surface-card border border-border-default p-4 rounded-xl flex flex-wrap items-end gap-4 shadow-card"
      >
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-text-muted text-xs font-semibold uppercase tracking-wider">
            From Date
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-background-primary border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-text-muted text-xs font-semibold uppercase tracking-wider">
            To Date
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-background-primary border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>

        {showLimit && (
          <div className="flex flex-col gap-1.5 min-w-[100px]">
            <label className="text-text-muted text-xs font-semibold uppercase tracking-wider">
              Limit Size
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-background-primary border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-colors"
            >
              <option value={10}>10 Items</option>
              <option value={25}>25 Items</option>
              <option value={50}>50 Items</option>
              <option value={100}>100 Items</option>
            </select>
          </div>
        )}

        <div className="flex gap-2 ml-auto">
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="primary" size="sm">
            Apply Filters
          </Button>
        </div>
      </form>
    );
  },
);

FilterPanel.displayName = 'FilterPanel';
