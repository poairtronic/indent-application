import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Send,
  CheckCircle,
  Package,
  Truck,
  Play,
  Calculator,
  DollarSign,
  Archive,
  CheckSquare,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Input } from '../../../components/ui/Input';
import { TextArea } from '../../../components/ui/TextArea';
import {
  useSubmitIndent,
  useVerifyStores,
  useIssueStores,
  useReceiveProduction,
  useStartProduction,
  useCompleteProduction,
  useVerifyAccounts,
  useFinancialClose,
  useArchiveIndent,
  useCompleteIndent,
} from '../../../api/services/indents/hooks';
import { useAuthStore } from '../../../store/authStore';
import { AppPermission } from '../../../constants/permissions';
import type { WorkflowState } from '../../../constants/workflow';

interface WorkflowActionsProps {
  currentState: WorkflowState;
  indentId: string;
  indentNumber: string;
  indentRemarks?: string;
  workflowHistory?: Array<{ remarks?: string }>;
  onSuccess?: () => void;
}

interface ActionConfig {
  label: string;
  icon: React.ReactNode;
  variant: 'primary' | 'danger' | 'outline';
  permission: string;
  confirmTitle: string;
  confirmMessage: string;
  requiresInput?: boolean;
  inputLabel?: string;
  inputType?: 'text' | 'number';
  action: (remarks?: string) => void;
  isPending: boolean;
}

export const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  currentState,
  indentId,
  indentNumber,
  indentRemarks,
  workflowHistory,
  onSuccess,
}) => {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const queryClient = useQueryClient();

  const [confirmAction, setConfirmAction] = useState<{
    config: ActionConfig;
  } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [startedLocally, setStartedLocally] = useState(false);
  // Hooks must be initialized on every render, including renders with no
  // permission-gated actions.
  const executingRef = React.useRef(false);

  // Workflow mutation hooks
  const { mutateAsync: submitIndent, isPending: isSubmitting } = useSubmitIndent();
  const { mutateAsync: verifyStores, isPending: isVerifyingStores } = useVerifyStores();
  const { mutateAsync: issueStores, isPending: isIssuingStores } = useIssueStores();
  const { mutateAsync: receiveProduction, isPending: isReceiving } = useReceiveProduction();
  const { mutateAsync: startProduction, isPending: isStarting } = useStartProduction();
  const { mutateAsync: completeProduction, isPending: isCompletingProd } = useCompleteProduction();

  const { mutateAsync: verifyAccounts, isPending: isVerifyingAccounts } = useVerifyAccounts();
  const { mutateAsync: financialClose, isPending: isClosing } = useFinancialClose();
  const { mutateAsync: archive, isPending: isArchiving } = useArchiveIndent();
  const { mutateAsync: complete, isPending: isCompleting } = useCompleteIndent();

  const isManufacturingStarted =
    startedLocally ||
    indentRemarks?.includes('[PRODUCTION_STARTED]') ||
    Boolean(
      workflowHistory?.some(
        (h) =>
          h.remarks?.toLowerCase().includes('started manufacturing') ||
          h.remarks?.includes('[PRODUCTION_STARTED]'),
      ),
    );

  const buildActions = (): ActionConfig[] => {
    const actions: ActionConfig[] = [];
    switch (currentState) {
      case 'DRAFT':
        if (hasPermission(AppPermission.INDENT_SUBMIT)) {
          actions.push({
            label: 'Submit Design',
            icon: <Send size={16} />,
            variant: 'primary',
            permission: AppPermission.INDENT_SUBMIT,
            confirmTitle: `Submit Indent: ${indentNumber}`,
            confirmMessage:
              'This will submit the design for Stores processing. The indent will no longer be editable. Continue?',
            action: async (r) => {
              await submitIndent({ id: indentId, remarks: r });
              onSuccess?.();
            },
            isPending: isSubmitting,
          });
        }
        break;

      case 'DESIGN_COMPLETED':
        if (hasPermission(AppPermission.STORES_ISSUE)) {
          actions.push({
            label: 'Verify Stock',
            icon: <CheckCircle size={16} />,
            variant: 'primary',
            permission: AppPermission.STORES_ISSUE,
            confirmTitle: `Verify Stock: ${indentNumber}`,
            confirmMessage:
              'Confirm stock verification for this indent. This will move the workflow to Stores Processing.',
            action: async () => {
              await verifyStores(indentId);
              onSuccess?.();
            },
            isPending: isVerifyingStores,
          });
        }
        break;

      case 'STORES_PROCESSING':
        if (hasPermission(AppPermission.STORES_ISSUE)) {
          actions.push({
            label: 'Issue Materials',
            icon: <Package size={16} />,
            variant: 'primary',
            permission: AppPermission.STORES_ISSUE,
            confirmTitle: `Issue Materials: ${indentNumber}`,
            confirmMessage:
              'Confirm raw materials have been issued and dispatched to Production. This will move the workflow to Materials Issued.',
            action: async (r) => {
              await issueStores({ id: indentId, data: { remarks: r || 'Materials issued' } });
              onSuccess?.();
            },
            isPending: isIssuingStores,
          });
        }
        break;

      case 'MATERIALS_ISSUED':
        if (hasPermission(AppPermission.PRODUCTION_UPDATE)) {
          actions.push({
            label: 'Receive Materials',
            icon: <Truck size={16} />,
            variant: 'primary',
            permission: AppPermission.PRODUCTION_UPDATE,
            confirmTitle: `Receive Materials: ${indentNumber}`,
            confirmMessage:
              'Confirm raw materials have been received at the Production work center.',
            action: async (r) => {
              await receiveProduction({ id: indentId, remarks: r || 'Materials received' });
              onSuccess?.();
            },
            isPending: isReceiving,
          });
        }
        break;

      case 'PRODUCTION_PROCESSING':
        if (hasPermission(AppPermission.PRODUCTION_UPDATE)) {
          if (!isManufacturingStarted) {
            actions.push({
              label: 'Start Manufacturing',
              icon: <Play size={16} />,
              variant: 'primary',
              permission: AppPermission.PRODUCTION_UPDATE,
              confirmTitle: `Start Manufacturing: ${indentNumber}`,
              confirmMessage: 'Confirm manufacturing has started for this indent.',
              action: async (r) => {
                await startProduction({ id: indentId, remarks: r || 'Manufacturing started' });
                setStartedLocally(true);
                onSuccess?.();
              },
              isPending: isStarting,
            });
          } else {
            actions.push({
              label: 'Complete Manufacturing',
              icon: <CheckCircle size={16} />,
              variant: 'primary',
              permission: AppPermission.PRODUCTION_UPDATE,
              confirmTitle: `Complete Manufacturing: ${indentNumber}`,
              confirmMessage:
                'Confirm manufacturing is complete and the product is ready for delivery.',
              action: async (r) => {
                await completeProduction({ id: indentId, remarks: r || 'Manufacturing completed' });
                onSuccess?.();
              },
              isPending: isCompletingProd,
            });
          }
        }
        break;

      case 'PRODUCTION_COMPLETED':
        if (hasPermission(AppPermission.ACCOUNTS_VERIFY)) {
          actions.push({
            label: 'Start Cost Verification',
            icon: <Calculator size={16} />,
            variant: 'primary',
            permission: AppPermission.ACCOUNTS_VERIFY,
            confirmTitle: `Start Cost Verification: ${indentNumber}`,
            confirmMessage:
              'Begin financial cost verification for this indent. This will transition the state to Accounts Cost Verification.',
            action: async (r) => {
              await verifyAccounts({ id: indentId, remarks: r || 'Costs verification started' });
              onSuccess?.();
            },
            isPending: isVerifyingAccounts,
          });
        }
        break;

      case 'ACCOUNTS_COST_VERIFICATION':
        // BIZ-001: Financial closure is not allowed directly from cost verification.
        // Accounts MUST submit actual costs first (→ ACTUAL_COST_UPDATED) before
        // the 'Finalize Financial Closure' action becomes available.
        // No workflow action button here — the Accounts cost entry form handles this state.
        break;

      case 'ACTUAL_COST_UPDATED':
        if (hasPermission(AppPermission.ACCOUNTS_CLOSE)) {
          actions.push({
            label: 'Finalize Financial Closure',
            icon: <DollarSign size={16} />,
            variant: 'primary',
            permission: AppPermission.ACCOUNTS_CLOSE,
            confirmTitle: `Financial Closure: ${indentNumber}`,
            confirmMessage:
              'Finalize the financial record and close the cost sheet. This will move the workflow to Financial Closure.',
            requiresInput: true,
            inputLabel: 'Closure Notes (optional)',
            action: async (r) => {
              await financialClose({
                id: indentId,
                data: { closureNotes: r || 'Financial closure approved', remarks: r },
              });
              onSuccess?.();
            },
            isPending: isClosing,
          });
        }
        break;

      case 'ACCOUNTS_FINANCIAL_CLOSURE':
        if (hasPermission(AppPermission.SYSTEM_ARCHIVE)) {
          actions.push({
            label: 'Archive Transaction',
            icon: <Archive size={16} />,
            variant: 'primary',
            permission: AppPermission.SYSTEM_ARCHIVE,
            confirmTitle: `Archive Transaction: ${indentNumber}`,
            confirmMessage:
              'Archive this business transaction. All data will be locked and preserved for audit.',
            action: async (r) => {
              await archive({ id: indentId, remarks: r || 'Transaction archived' });
              onSuccess?.();
            },
            isPending: isArchiving,
          });
        }
        break;

      case 'ARCHIVED':
        if (hasPermission(AppPermission.SYSTEM_COMPLETE)) {
          actions.push({
            label: 'Complete Transaction',
            icon: <CheckSquare size={16} />,
            variant: 'primary',
            permission: AppPermission.SYSTEM_COMPLETE,
            confirmTitle: `Complete Transaction: ${indentNumber}`,
            confirmMessage:
              'Mark this business transaction as fully completed. This is the terminal state.',
            action: async (r) => {
              await complete({ id: indentId, remarks: r || 'Transaction completed' });
              onSuccess?.();
            },
            isPending: isCompleting,
          });
        }
        break;

      case 'COMPLETED':
        // Terminal state - no actions
        break;
    }

    return actions;
  };

  const actions = buildActions();

  if (actions.length === 0) return null;

  const handleConfirm = async () => {
    if (!confirmAction || executingRef.current) return;
    executingRef.current = true;
    setIsExecuting(true);
    try {
      await confirmAction.config.action(remarks || undefined);
      // Do not leave the action panel on the pre-mutation workflow state.
      // Closure must read ACTUAL_COST_UPDATED after the first cost save.
      await queryClient.refetchQueries({
        queryKey: ['api', 'detail', 'indents', indentId],
      });
      setConfirmAction(null);
      setRemarks('');
    } catch (error: any) {
      window.alert(error.message || 'An error occurred while performing this action.');
    } finally {
      executingRef.current = false;
      setIsExecuting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            size="sm"
            onClick={() => {
              setConfirmAction({ config: action });
              setRemarks('');
            }}
            loading={action.isPending}
            className="flex items-center gap-2"
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onCancel={() => {
          setConfirmAction(null);
          setRemarks('');
        }}
        onConfirm={handleConfirm}
        title={confirmAction?.config.confirmTitle ?? ''}
        message={
          <div className="space-y-3">
            <p>{confirmAction?.config.confirmMessage}</p>
            {confirmAction?.config.requiresInput && (
              <TextArea
                label={confirmAction.config.inputLabel || 'Remarks'}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter notes..."
              />
            )}
            {!confirmAction?.config.requiresInput && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Remarks (optional)
                </label>
                <Input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add remarks..."
                />
              </div>
            )}
          </div>
        }
        confirmLabel={confirmAction?.config.label ?? 'Confirm'}
        tone={confirmAction?.config.variant === 'danger' ? 'danger' : 'primary'}
        loading={isExecuting || confirmAction?.config.isPending}
      />
    </>
  );
};
