import React from 'react';
import type { IndentData } from '../../../api/services/indents/service';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Download } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { getWorkflowAccess } from '../../../constants/workflow';
import {
  useIssueMaterialItem,
  useEnterActualCosts,
  useUpdateIndent,
  useUploadAttachment,
  useDownloadAttachment,
} from '../../../api/services/indents/hooks';
import { IndentWorkflowTimeline } from './WorkflowTimeline';
import { IndentActivityFeed } from './ActivityFeed';
import { parseItemRemarks, parseIndentRemarks, IndentForm } from './IndentForm';

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
  const formatStatus = React.useCallback((state: string) => state.replace(/_/g, ' '), []);
  const { mutateAsync: issueItem, isPending: isIssuingItem } = useIssueMaterialItem();
  const { mutateAsync: enterActualCosts, isPending: isEnteringCosts } = useEnterActualCosts();
  const { mutateAsync: uploadAttachment, isPending: isUploadingAttachment } = useUploadAttachment();
  const { mutateAsync: downloadAttachment } = useDownloadAttachment();

  const user = useAuthStore((s) => s.user);

  const isDesignTeam = React.useMemo(() => {
    const code = user?.department?.departmentCode?.toUpperCase() ?? '';
    return code === 'DESIGN' || code === 'DSGN';
  }, [user]);

  const canIssueStores = React.useMemo(() => {
    const isValidState =
      indent.currentState === 'DESIGN_COMPLETED' || indent.currentState === 'STORES_PROCESSING';
    if (!isValidState) return false;

    const access = getWorkflowAccess(indent.currentState as any, user);
    return access.canEdit;
  }, [indent, user]);

  const isAccountsMode = React.useMemo(() => {
    return (
      indent.currentState === 'ACCOUNTS_COST_VERIFICATION' &&
      getWorkflowAccess(indent.currentState as any, user).canEdit
    );
  }, [indent.currentState, user]);

  const isProductionMode = React.useMemo(() => {
    return (
      indent.currentState === 'PRODUCTION_PROCESSING' &&
      getWorkflowAccess(indent.currentState as any, user).canEdit
    );
  }, [indent.currentState, user]);

  const { mutateAsync: updateIndent, isPending: isUpdatingProduction } = useUpdateIndent();

  const handleAccountsAttachmentUpload = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = '';
      if (files.length === 0) return;

      try {
        for (const file of files) {
          const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
          if (!['.pdf', '.xlsx', '.xls'].includes(extension)) {
            throw new Error(`"${file.name}" is not a PDF or Excel file.`);
          }
          if (file.size > 20 * 1024 * 1024) {
            throw new Error(`"${file.name}" exceeds the 20MB limit.`);
          }
          await uploadAttachment({
            id: indent.id,
            file,
            remarks: 'Vendor bill uploaded by Accounts',
          });
        }
        window.alert(`${files.length} file${files.length === 1 ? '' : 's'} uploaded successfully`);
      } catch (error: any) {
        window.alert(error?.message || 'Failed to upload the document');
      }
    },
    [indent.id, uploadAttachment],
  );

  const handleProductionSubmit = React.useCallback(
    async (data: any) => {
      try {
        const payload = {
          indent: {
            items: data.indent.items,
          },
        };
        await updateIndent({ id: indent.id, payload: payload as any });
        window.alert('Production details updated successfully');
      } catch (e: any) {
        window.alert(e.message || 'Failed to update production details');
      }
    },
    [indent.id, updateIndent],
  );

  const parsedRemarks = parseIndentRemarks(indent.remarks);

  const handleAccountsSubmit = async (data: any) => {
    try {
      const payload = {
        costItems: data.costSheet.costItems.map((ci: any, index: number) => ({
          costItemId: indent.costSheet?.costItems?.[index]?.id,
          actualRate: ci.actualRate ?? 0,
          actualQuantity: ci.predictedQuantity ?? 0,
        })),
        processCosts: (indent.costSheet?.processCosts || []).map((pc: any) => {
          const matched = data.costSheet.processCosts?.find(
            (dpc: any) => dpc.processId === pc.processId,
          );
          return {
            processCostId: pc.id,
            actualCost: matched?.actualCost ?? 0,
            actualHours: matched?.actualHours ?? 0,
          };
        }),
        actualDesignCost: data.costSheet.actualDesignCost || 0,
        actualOverheadCost: data.costSheet.actualOverheadCost || 0,
        actualContingencyCost: data.costSheet.actualContingencyCost || 0,
      };

      await enterActualCosts({ id: indent.id, data: payload });
      window.alert('Actual costs updated successfully');
    } catch (e: any) {
      window.alert(e.message || 'Failed to verify actual costs');
    }
  };

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
                  {indent.layoutNumber || parsedRemarks.layoutNumber || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Customer Name</p>
                <p className="text-sm font-medium text-text-primary">
                  {indent.customerName || parsedRemarks.customerName || 'N/A'}
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

          {/* Detailed Indent & Costing View */}
          <div className="mt-8">
            <IndentForm
              key={indent.id + '-' + indent.updatedAt}
              initialData={indent}
              onSubmit={
                isAccountsMode
                  ? handleAccountsSubmit
                  : isProductionMode
                    ? handleProductionSubmit
                    : () => {}
              }
              forceReadOnly={!isAccountsMode && !isProductionMode}
              isAccountsMode={isAccountsMode}
              isProductionMode={isProductionMode}
              isLoading={isEnteringCosts || isUpdatingProduction}
            />
          </div>

          {/* Component Issue Status (For Stores) */}
          {!isDesignTeam && (
            <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
              <h3 className="text-sm font-bold text-text-primary mb-4">Component Issue Status</h3>
              {indent.items && indent.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border-default text-text-muted font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">S.No</th>
                        <th className="py-3 px-4">Part Name / Product</th>
                        <th className="py-3 px-4">Material</th>
                        <th className="py-3 px-4">Quantity</th>
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
                            <td className="py-3 px-4 font-medium">{item.quantity}</td>
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
                                    try {
                                      await issueItem({ id: indent.id, itemId: item.id });
                                      window.alert('Component issued successfully');
                                    } catch (error: any) {
                                      window.alert(error.message || 'Failed to issue component');
                                    }
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
          )}

          {/* Attachments */}
          {(isAccountsMode || (indent.attachments && indent.attachments.length > 0)) && (
            <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-sm font-bold text-text-primary">
                  Attachments ({indent.attachments?.length ?? 0})
                </h3>
                {isAccountsMode && (
                  <label
                    htmlFor="accounts-document-upload"
                    className="inline-flex items-center justify-center rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    {isUploadingAttachment ? 'Uploading...' : 'Upload Document'}
                    <input
                      id="accounts-document-upload"
                      type="file"
                      accept=".pdf,.xlsx,.xls"
                      multiple
                      className="hidden"
                      onChange={handleAccountsAttachmentUpload}
                      disabled={isUploadingAttachment}
                    />
                  </label>
                )}
              </div>
              <div className="space-y-2">
                {indent.attachments?.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 border border-border-default rounded-lg bg-background-primary hover:border-accent-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-accent-primary/10 flex items-center justify-center text-accent-primary text-xs font-bold shrink-0">
                        {att.fileType?.slice(0, 3).toUpperCase() || 'FILE'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {att.fileName}
                        </p>
                        <p className="text-xs text-text-muted">
                          {att.department || 'Design'} •{' '}
                          {new Date(att.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        try {
                          const downloadKey = att.storageFileName || att.fileName;
                          await downloadAttachment(downloadKey);
                        } catch (err: any) {
                          window.alert(err?.message || `Failed to download ${att.fileName}`);
                        }
                      }}
                      className="h-8 px-3 text-xs flex items-center gap-1.5 shrink-0 ml-3"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </Button>
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
