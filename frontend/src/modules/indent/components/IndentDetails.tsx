import React from 'react';
import type { IndentData } from '../../../api/services/indents/service';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/authStore';
import { getWorkflowAccess } from '../../../constants/workflow';
import { useIssueMaterialItem } from '../../../api/services/indents/hooks';
import { IndentWorkflowTimeline } from './WorkflowTimeline';
import { IndentActivityFeed } from './ActivityFeed';

import { parseItemRemarks, parseIndentRemarks } from './IndentForm';

interface IndentDetailsProps {
  indent: IndentData;
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

export const IndentDetails: React.FC<IndentDetailsProps> = ({ indent }) => {
  const formatStatus = (state: string) => state.replace(/_/g, ' ');
  const { mutateAsync: issueItem, isPending: isIssuingItem } = useIssueMaterialItem();

  const user = useAuthStore((s) => s.user);

  const canIssueStores = React.useMemo(() => {
    const isValidState =
      indent.currentState === 'DESIGN_COMPLETED' || indent.currentState === 'STORES_PROCESSING';
    if (!isValidState) return false;

    const access = getWorkflowAccess(indent.currentState as any, user);
    return access.canEdit;
  }, [indent, user]);

  const parsedRemarks = parseIndentRemarks(indent.remarks);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">
            {indent.indentNumber} {indent.purpose ? `(PO: ${indent.purpose})` : ''}
          </h2>
          <p className="text-sm text-text-secondary">
            Material request for PO {indent.purpose || 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-text-muted uppercase tracking-wider">Status</p>
            <Badge tone={statusTone[indent.currentState] ?? 'gray'}>
              {formatStatus(indent.currentState)}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted uppercase tracking-wider">Priority</p>
            <Badge tone={priorityTone[indent.priority] ?? 'gray'}>{indent.priority}</Badge>
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <h3 className="text-sm font-bold text-text-primary mb-6">Workflow Progress</h3>
        <IndentWorkflowTimeline currentStatus={indent.currentState} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
            <h3 className="text-sm font-bold text-text-primary mb-4">Indent Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-text-muted mb-1">PO Number</p>
                <p className="text-sm font-medium text-text-primary">{indent.purpose || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Layout Number</p>
                <p className="text-sm font-medium text-text-primary">
                  {parsedRemarks.layoutNumber || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Customer Name</p>
                <p className="text-sm font-medium text-text-primary">
                  {parsedRemarks.customerName || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Department</p>
                <p className="text-sm font-medium text-text-primary">
                  {indent.departmentName || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Priority</p>
                <Badge tone={priorityTone[indent.priority] ?? 'gray'}>{indent.priority}</Badge>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Required Date</p>
                <p className="text-sm font-medium text-text-primary">
                  {new Date(indent.requiredDate).toLocaleDateString()}
                </p>
              </div>
              {indent.requiredDeliveryDate && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Delivery Date</p>
                  <p className="text-sm font-medium text-text-primary">
                    {new Date(indent.requiredDeliveryDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-text-muted mb-1">Created By</p>
                <p className="text-sm font-medium text-text-primary">
                  {indent.creatorName || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Created At</p>
                <p className="text-sm font-medium text-text-primary">
                  {new Date(indent.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Last Updated</p>
                <p className="text-sm font-medium text-text-primary">
                  {new Date(indent.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {parsedRemarks.userRemarks && (
              <div className="mt-6 pt-6 border-t border-border-default">
                <p className="text-xs text-text-muted mb-1">Remarks</p>
                <p className="text-sm text-text-secondary">{parsedRemarks.userRemarks}</p>
              </div>
            )}
          </div>

          {/* Material Requirements */}
          <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
            <h3 className="text-sm font-bold text-text-primary mb-4">Material Requirements</h3>
            {indent.items && indent.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-default text-text-muted font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">S.No</th>
                      <th className="py-3 px-4">Part Name / Product</th>
                      <th className="py-3 px-4">Material</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Status</th>
                      {canIssueStores && <th className="py-3 px-4 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default/50">
                    {indent.items.map((item, index) => {
                      const parsed = parseItemRemarks(item.remarks);
                      return (
                        <tr key={item.id} className="hover:bg-background-primary/40 text-sm">
                          <td className="py-3 px-4 text-text-muted font-mono">{index + 1}</td>
                          <td className="py-3 px-4 font-medium text-text-primary">
                            {parsed.product || '—'}
                          </td>
                          <td className="py-3 px-4">
                            {item.material?.materialName || item.materialId}
                          </td>
                          <td className="py-3 px-4">{parsed.size || '—'}</td>
                          <td className="py-3 px-4 font-medium">{item.quantity}</td>
                          <td className="py-3 px-4 text-text-secondary">
                            {item.unit?.symbol || item.unit?.unitName || item.unitId}
                          </td>
                          <td className="py-3 px-4 text-text-secondary">{parsed.source || '—'}</td>
                          <td className="py-3 px-4">
                            {item.status && (
                              <Badge
                                tone={
                                  item.status === 'ISSUED'
                                    ? 'green'
                                    : item.status === 'VERIFIED'
                                      ? 'blue'
                                      : 'yellow'
                                }
                              >
                                {item.status}
                              </Badge>
                            )}
                          </td>
                          {canIssueStores && (
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant={item.status === 'ISSUED' ? 'outline' : 'primary'}
                                disabled={item.status === 'ISSUED' || isIssuingItem}
                                onClick={async () => {
                                  await issueItem({ id: indent.id, itemId: item.id });
                                }}
                                className="text-xs py-1 px-3"
                              >
                                {item.status === 'ISSUED' ? 'Issued ✓' : 'Issue Component'}
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-text-muted text-center py-4">
                No material requirements recorded.
              </p>
            )}
          </div>

          {/* Cost Sheet Summary */}
          {indent.costSheet && (
            <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
              <h3 className="text-sm font-bold text-text-primary mb-4">Cost Sheet Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-text-muted mb-1">Cost Number</p>
                  <p className="text-sm font-bold text-accent-primary">
                    {indent.costSheet.costNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Predicted Total</p>
                  <p className="text-sm font-bold text-text-primary">
                    ₹{indent.costSheet.predictedTotal.toLocaleString()}
                  </p>
                </div>
                {indent.costSheet.actualTotal !== null &&
                  indent.costSheet.actualTotal !== undefined && (
                    <div>
                      <p className="text-xs text-text-muted mb-1">Actual Total</p>
                      <p className="text-sm font-bold text-text-primary">
                        ₹{indent.costSheet.actualTotal.toLocaleString()}
                      </p>
                    </div>
                  )}
                {indent.costSheet.varianceAmount !== null &&
                  indent.costSheet.varianceAmount !== undefined && (
                    <div>
                      <p className="text-xs text-text-muted mb-1">Variance</p>
                      <p
                        className={`text-sm font-bold ${indent.costSheet.varianceAmount > 0 ? 'text-status-error' : 'text-status-success'}`}
                      >
                        ₹{indent.costSheet.varianceAmount.toLocaleString()}{' '}
                        {indent.costSheet.variancePercentage !== null &&
                          indent.costSheet.variancePercentage !== undefined &&
                          `(${indent.costSheet.variancePercentage.toFixed(1)}%)`}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Attachments */}
          {indent.attachments && indent.attachments.length > 0 && (
            <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
              <h3 className="text-sm font-bold text-text-primary mb-4">
                Attachments ({indent.attachments.length})
              </h3>
              <div className="space-y-2">
                {indent.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 border border-border-default rounded-lg bg-background-primary"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-accent-primary/10 flex items-center justify-center text-accent-primary text-xs font-bold">
                        {att.fileType?.slice(0, 3).toUpperCase() || 'FILE'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{att.fileName}</p>
                        <p className="text-xs text-text-muted">
                          {att.department || 'Design'} •{' '}
                          {new Date(att.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Activity */}
        <div className="lg:col-span-1">
          <IndentActivityFeed history={indent.workflowHistory} />
        </div>
      </div>
    </div>
  );
};
