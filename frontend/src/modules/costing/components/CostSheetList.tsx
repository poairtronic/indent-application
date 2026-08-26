import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { Pagination } from '../../../components/ui/Pagination';
import { Badge } from '../../../components/ui/Badge';
import { useCurrencyFormatter } from '../../../utils/currencyFormatter';
import type { IndentData } from '../../../api/services/indents/service';

interface CostSheetListProps {
  indents: IndentData[];
  isLoading: boolean;
  onRefresh: () => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  viewMode: 'list' | 'grid';
}

const statusTone: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
  DRAFT: 'gray',
  DESIGN_COMPLETED: 'blue',
  STORES_PROCESSING: 'yellow',
  MATERIALS_ISSUED: 'yellow',
  PRODUCTION_PROCESSING: 'yellow',
  PRODUCTION_COMPLETED: 'yellow',
  ACCOUNTS_COST_VERIFICATION: 'yellow',
  ACTUAL_COST_UPDATED: 'yellow',
  ACCOUNTS_FINANCIAL_CLOSURE: 'blue',
  ARCHIVED: 'gray',
  COMPLETED: 'green',
};

export const CostSheetList: React.FC<CostSheetListProps> = ({
  indents,
  isLoading,
  pagination,
  onPageChange,
  viewMode,
}) => {
  const navigate = useNavigate();
  const formatCurrency = useCurrencyFormatter({ maximumFractionDigits: 0 });

  const formatStatus = (state: string) => state.replace(/_/g, ' ');

  const gridRender = (item: IndentData) => (
    <div
      className="flex flex-col gap-2 p-4 border border-border-default rounded-xl bg-surface-card shadow-sm hover:shadow-card transition-shadow cursor-pointer"
      onClick={() => navigate(`/cost-sheets/${item.id}`)}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="font-bold text-text-primary text-sm block">
            {item.costNumber || 'N/A'}
          </span>
          <span className="text-xs text-text-muted">{item.indentNumber}</span>
        </div>
        <Badge tone={statusTone[item.currentState] ?? 'gray'}>
          {formatStatus(item.currentState)}
        </Badge>
      </div>
      <div className="text-xs text-text-secondary mt-1">
        <p>{item.productName || 'N/A'}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border-default">
        <div>
          <p className="text-[10px] text-text-muted uppercase">Planned</p>
          <p className="font-medium text-sm">{formatCurrency(item.predictedTotal)}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase">Cost Number</p>
          <p className="font-medium text-sm text-accent-primary">{item.costNumber || '--'}</p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="bg-surface-card border border-border-default rounded-xl p-5 space-y-4 shadow-card animate-pulse"
          >
            <div className="h-4 bg-background-secondary rounded w-3/4" />
            <div className="h-3 bg-background-secondary rounded w-1/2" />
            <div className="h-3 bg-background-secondary rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (indents.length === 0) {
    return (
      <div className="bg-surface-card border border-border-default rounded-xl p-8 text-center">
        <p className="text-sm font-medium text-text-primary mb-1">No cost sheets found</p>
        <p className="text-xs text-text-muted">
          No cost sheets match your search criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  const virtualizer = useWindowVirtualizer({
    count: indents.length,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <div className="w-full">
      {viewMode === 'list' ? (
        <>
          <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-background-secondary/60 border-b border-border-default text-text-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Cost Sheet #</th>
                    <th className="py-3 px-4">Indent #</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Planned Cost</th>
                    <th className="py-3 px-4 text-right">Actual Cost</th>
                    <th className="py-3 px-4 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/50 text-text-primary">
                  {virtualizer.getVirtualItems().length > 0 &&
                    virtualizer.getVirtualItems()[0]?.start > 0 && (
                      <tr>
                        <td
                          style={{ height: `${virtualizer.getVirtualItems()[0].start}px` }}
                          colSpan={7}
                        />
                      </tr>
                    )}
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const item = indents[virtualRow.index];
                    const actualTotal = item.costSheet?.actualTotal;
                    const variance =
                      actualTotal !== undefined && item.predictedTotal !== undefined
                        ? actualTotal - item.predictedTotal
                        : null;
                    const varianceColor =
                      variance !== null
                        ? variance > 0
                          ? 'text-status-error'
                          : variance < 0
                            ? 'text-status-success'
                            : ''
                        : '';

                    return (
                      <tr
                        key={item.id}
                        ref={virtualizer.measureElement}
                        data-index={virtualRow.index}
                        className="hover:bg-background-primary/40 transition-colors cursor-pointer"
                        onClick={() => navigate(`/cost-sheets/${item.id}`)}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-accent-primary">
                          {item.costNumber || '--'}
                        </td>
                        <td className="py-3.5 px-4">{item.indentNumber}</td>
                        <td className="py-3.5 px-4 font-medium">{item.productName || 'N/A'}</td>
                        <td className="py-3.5 px-4">
                          <Badge tone={statusTone[item.currentState] ?? 'gray'}>
                            {formatStatus(item.currentState)}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium">
                          {formatCurrency(item.predictedTotal)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium">
                          {actualTotal !== undefined ? (
                            <span className="text-accent-primary">
                              {formatCurrency(actualTotal)}
                            </span>
                          ) : (
                            '--'
                          )}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-medium ${varianceColor}`}>
                          {variance !== null
                            ? `${variance > 0 ? '+' : ''}${formatCurrency(Math.abs(variance))}`
                            : '--'}
                        </td>
                      </tr>
                    );
                  })}
                  {virtualizer.getVirtualItems().length > 0 &&
                    virtualizer.getTotalSize() -
                      virtualizer.getVirtualItems()[virtualizer.getVirtualItems().length - 1].end >
                      0 && (
                      <tr>
                        <td
                          style={{
                            height: `${virtualizer.getTotalSize() - virtualizer.getVirtualItems()[virtualizer.getVirtualItems().length - 1].end}px`,
                          }}
                          colSpan={7}
                        />
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
          {pagination.total > pagination.limit && (
            <div className="mt-4">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {indents.map((item) => (
            <div key={item.id}>{gridRender(item)}</div>
          ))}
        </div>
      )}
    </div>
  );
};
