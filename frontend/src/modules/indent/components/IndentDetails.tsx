import React from 'react';
import type { Indent } from '../../../types/indent';
import { StatusChip } from '../../../components/ui/StatusChip';
import { IndentWorkflowTimeline } from './WorkflowTimeline';
import { IndentActivityFeed } from './ActivityFeed';
import { Table } from '../../../components/ui/Table';

interface IndentDetailsProps {
  indent: Indent;
}

export const IndentDetails: React.FC<IndentDetailsProps> = ({ indent }) => {
  const itemColumns = [
    { key: 'material', label: 'Material', render: (item: any) => item.material?.name || 'N/A' },
    { key: 'quantity', label: 'Quantity', render: (item: any) => item.quantity },
    { key: 'unit', label: 'Unit', render: (item: any) => item.unit?.name || 'N/A' },
    { key: 'remarks', label: 'Remarks', render: (item: any) => item.remarks || '-' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">{indent.indentNumber}</h2>
          <p className="text-sm text-text-secondary">{indent.purpose || 'No purpose specified'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-text-muted uppercase tracking-wider">Status</p>
            <StatusChip status={indent.status} />
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <h3 className="text-sm font-bold text-text-primary mb-6">Workflow Progress</h3>
        <IndentWorkflowTimeline currentStatus={indent.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
            <h3 className="text-sm font-bold text-text-primary mb-4">Indent Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-text-muted mb-1">Product</p>
                <p className="text-sm font-medium text-text-primary">
                  {indent.product?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Department</p>
                <p className="text-sm font-medium text-text-primary">
                  {indent.department?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Priority</p>
                <p className="text-sm font-medium text-text-primary">{indent.priority}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Required Date</p>
                <p className="text-sm font-medium text-text-primary">
                  {new Date(indent.requiredDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Created By</p>
                <p className="text-sm font-medium text-text-primary">
                  {indent.creator?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Created At</p>
                <p className="text-sm font-medium text-text-primary">
                  {new Date(indent.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {indent.remarks && (
              <div className="mt-6 pt-6 border-t border-border-default">
                <p className="text-xs text-text-muted mb-1">Remarks</p>
                <p className="text-sm text-text-secondary">{indent.remarks}</p>
              </div>
            )}
          </div>

          <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
            <h3 className="text-sm font-bold text-text-primary mb-4">Material Requirements</h3>
            <Table data={indent.indentItems || []} columns={itemColumns as any} />
          </div>
        </div>

        {/* Sidebar Activity */}
        <div className="lg:col-span-1">
          <IndentActivityFeed history={indent.workflowHistory} />
        </div>
      </div>
    </div>
  );
};
