import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '../../../components/ui/Table';
import { StatusChip } from '../../../components/ui/StatusChip';
import type { Indent } from '../../../types/indent';

interface IndentListProps {
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

export const IndentList: React.FC<IndentListProps> = ({
  indents,
  isLoading,
  pagination,
  onPageChange,
  viewMode,
}) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'indentNumber',
      label: 'Indent #',
      render: (item: Indent) => (
        <span className="font-medium text-text-primary">{item.indentNumber}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      header: 'Status',
      render: (item: Indent) => <StatusChip status={item.status} />,
    },
    {
      key: 'department',
      label: 'Department',
      header: 'Department',
      render: (item: Indent) => item.department?.name || 'N/A',
    },
    {
      key: 'requiredDate',
      label: 'Required Date',
      header: 'Required Date',
      render: (item: Indent) => new Date(item.requiredDate).toLocaleDateString(),
    },
    {
      key: 'createdAt',
      label: 'Created At',
      header: 'Created At',
      render: (item: Indent) => new Date(item.createdAt).toLocaleDateString(),
    },
  ];

  const gridRender = (item: Indent) => (
    <div
      className="flex flex-col gap-2 p-4 border border-border-default rounded-xl bg-surface-card shadow-sm hover:shadow-card transition-shadow cursor-pointer"
      onClick={() => navigate(`/indents/${item.id}`)}
    >
      <div className="flex justify-between items-start">
        <span className="font-bold text-text-primary text-sm">{item.indentNumber}</span>
        <StatusChip status={item.status} />
      </div>
      <div className="text-xs text-text-secondary mt-2">
        <p>
          <span className="text-text-muted">Dept:</span> {item.department?.name || 'N/A'}
        </p>
        <p>
          <span className="text-text-muted">Req:</span>{' '}
          {new Date(item.requiredDate).toLocaleDateString()}
        </p>
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
          emptyMessage="There are currently no indents matching your search criteria."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indents.map((item, idx) => (
            <div key={idx}>{gridRender(item)}</div>
          ))}
          {indents.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-12 text-text-muted">
              There are currently no indents matching your search criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
