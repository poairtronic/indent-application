import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '../../../components/ui/Pagination';
import { Badge } from '../../../components/ui/Badge';
import type { IndentData } from '../../../api/services/indents/service';
import { parseIndentRemarks } from './IndentForm';

interface IndentListProps {
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
  CUSTOMER_DELIVERED: 'blue',
  ACCOUNTS_COST_VERIFICATION: 'yellow',
  ACTUAL_COST_UPDATED: 'yellow',
  ACCOUNTS_FINANCIAL_CLOSURE: 'blue',
  ARCHIVED: 'gray',
  COMPLETED: 'green',
};

const priorityTone: Record<string, 'green' | 'yellow' | 'red' | 'blue'> = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'red',
  URGENT: 'red',
};

export const IndentList: React.FC<IndentListProps> = ({
  indents,
  isLoading,
  pagination,
  onPageChange,
  viewMode,
}) => {
  const navigate = useNavigate();

  const formatStatus = (state: string) => state.replace(/_/g, ' ');

  const gridRender = (item: IndentData) => (
    <div
      className="flex flex-col gap-2 p-4 border border-border-default rounded-xl bg-surface-card shadow-sm hover:shadow-card transition-shadow cursor-pointer"
      onClick={() => navigate(`/indents/${item.id}`)}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="font-bold text-text-primary text-sm block">{item.indentNumber}</span>
          {item.purpose && (
            <span className="text-text-muted text-[10px] uppercase font-semibold">
              PO: {item.purpose}
            </span>
          )}
        </div>
        <Badge tone={statusTone[item.currentState] ?? 'gray'}>
          {formatStatus(item.currentState)}
        </Badge>
      </div>
      <div className="text-xs text-text-secondary mt-2 space-y-1">
        {parseIndentRemarks(item.remarks).customerName && (
          <p>
            <span className="text-text-muted">Customer:</span>{' '}
            {parseIndentRemarks(item.remarks).customerName}
          </p>
        )}
        {parseIndentRemarks(item.remarks).layoutNumber && (
          <p>
            <span className="text-text-muted">Layout:</span>{' '}
            {parseIndentRemarks(item.remarks).layoutNumber}
          </p>
        )}
        <p>
          <span className="text-text-muted">Dept:</span> {item.departmentName || 'N/A'}
        </p>
        <p>
          <span className="text-text-muted">Priority:</span>{' '}
          <Badge tone={priorityTone[item.priority] ?? 'gray'}>{item.priority}</Badge>
        </p>
        <p>
          <span className="text-text-muted">Required:</span>{' '}
          {new Date(item.requiredDate).toLocaleDateString()}
        </p>
        {item.predictedTotal !== null &&
          item.predictedTotal !== undefined &&
          item.predictedTotal > 0 && (
            <p>
              <span className="text-text-muted">Cost:</span>{' '}
              <span className="font-medium text-accent-primary">
                ₹{item.predictedTotal.toLocaleString()}
              </span>
            </p>
          )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
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
        <p className="text-sm font-medium text-text-primary mb-1">No indents found</p>
        <p className="text-xs text-text-muted">
          No indents match your search criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {viewMode === 'list' ? (
        <>
          <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-background-secondary/60 border-b border-border-default text-text-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Indent #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Layout</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Required Date</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/50 text-text-primary">
                  {indents.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-background-primary/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/indents/${item.id}`)}
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-accent-primary block">
                          {item.indentNumber}
                        </span>
                        {item.purpose && (
                          <span className="text-text-muted text-[10px] uppercase font-semibold">
                            PO: {item.purpose}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        {parseIndentRemarks(item.remarks).customerName || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-text-secondary">
                        {parseIndentRemarks(item.remarks).layoutNumber || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        {item.departmentName || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone={priorityTone[item.priority] ?? 'gray'}>{item.priority}</Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone={statusTone[item.currentState] ?? 'gray'}>
                          {formatStatus(item.currentState)}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        {new Date(item.requiredDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-text-muted">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-accent-primary">
                        {item.predictedTotal !== null &&
                        item.predictedTotal !== undefined &&
                        item.predictedTotal > 0
                          ? `₹${item.predictedTotal.toLocaleString()}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indents.map((item) => (
            <div key={item.id}>{gridRender(item)}</div>
          ))}
        </div>
      )}
    </div>
  );
};
