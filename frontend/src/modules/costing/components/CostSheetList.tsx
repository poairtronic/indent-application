import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '../../../components/ui/Table';
import { StatusChip } from '../../../components/ui/StatusChip';
import type { Indent } from '../../../types/indent';

interface CostSheetListProps {
  indents: Indent[];
  isLoading: boolean;
  onRefresh: () => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  onPageChange: (page: number) => void;
  viewMode: 'list' | 'grid';
}

export const CostSheetList: React.FC<CostSheetListProps> = ({
  indents,
  isLoading,
  pagination,
  onPageChange,
  viewMode,
}) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'costNumber',
      label: 'Cost Sheet #',
      render: (item: Indent) => (
        <span className="font-medium text-text-primary">{item.costSheet?.costNumber || 'N/A'}</span>
      ),
    },
    {
      key: 'indentNumber',
      label: 'Indent #',
      render: (item: Indent) => <span className="text-text-secondary">{item.indentNumber}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      header: 'Status',
      render: (item: Indent) => <StatusChip status={item.status} />,
    },
    {
      key: 'plannedCost',
      label: 'Planned Cost (₹)',
      render: (item: Indent) => (
        <span className="font-medium text-text-primary">
          {item.costSheet?.predictedTotal
            ? `₹${item.costSheet.predictedTotal.toLocaleString()}`
            : '-'}
        </span>
      ),
    },
    {
      key: 'actualCost',
      label: 'Actual Cost (₹)',
      render: (item: Indent) => (
        <span className="font-medium text-accent-primary">
          {item.costSheet?.actualTotal ? `₹${item.costSheet.actualTotal.toLocaleString()}` : '-'}
        </span>
      ),
    },
    {
      key: 'variance',
      label: 'Variance %',
      render: (item: Indent) => {
        const variance = item.costSheet?.variancePercentage;
        if (variance === undefined || variance === null) return '-';
        const color = variance > 0 ? 'text-status-error' : 'text-status-success';
        return (
          <span className={`font-bold ${color}`}>
            {variance > 0 ? '+' : ''}
            {variance.toFixed(2)}%
          </span>
        );
      },
    },
  ];

  const gridRender = (item: Indent) => (
    <div
      className="flex flex-col gap-2 p-4 border border-border-default rounded-xl bg-surface-card shadow-sm hover:shadow-card transition-shadow cursor-pointer"
      onClick={() => navigate(`/cost-sheets/${item.id}`)}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="font-bold text-text-primary text-sm block">
            {item.costSheet?.costNumber || 'N/A'}
          </span>
          <span className="text-xs text-text-muted">{item.indentNumber}</span>
        </div>
        <StatusChip status={item.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border-default">
        <div>
          <p className="text-[10px] text-text-muted uppercase">Planned</p>
          <p className="font-medium text-sm">
            ₹{item.costSheet?.predictedTotal?.toLocaleString() || '-'}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase">Actual</p>
          <p className="font-medium text-sm text-accent-primary">
            ₹{item.costSheet?.actualTotal?.toLocaleString() || '-'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {viewMode === 'list' ? (
        <Table
          data={indents}
          columns={columns as any}
          loading={isLoading}
          page={pagination.page}
          totalPages={Math.ceil(pagination.total / pagination.limit)}
          onPageChange={onPageChange}
          emptyMessage="There are currently no cost sheets matching your criteria."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {indents.map((item, idx) => (
            <div key={idx}>{gridRender(item)}</div>
          ))}
          {indents.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-12 text-text-muted">
              There are currently no cost sheets matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
