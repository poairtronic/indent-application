import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useIndent,
  useEnterActualCosts,
  useFinancialClose,
  useUploadAttachment,
  useDownloadAttachment,
} from '../../api/services/indents/hooks';
import { useAuthStore } from '../../store/authStore';
import {
  ArrowLeft,
  Save,
  FileText,
  Download,
  CheckCircle,
  Clock,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  Printer,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FinancialSummaryWidget } from './components/FinancialSummaryWidget';
import { CostBreakdownChart } from './components/CostBreakdownChart';
import { Input } from '../../components/ui/Input';
import { ToastViewport, useToasts } from '../../components/ui/toast';
import { AppPermission } from '../../constants/permissions';
import { getWorkflowAccess } from '../../constants/workflow';
import { parseItemRemarks } from '../indent/components/IndentForm';
import { UniversalPrintModal, useUniversalPrint } from '../../components/print';
import { SingleCostSheetPrintSheet } from './components/SingleCostSheetPrintSheet';

const WORKFLOW_STATE_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  DESIGN_COMPLETED: 'Design Completed',
  STORES_PROCESSING: 'Stores Processing',
  MATERIALS_ISSUED: 'Materials Issued',
  PRODUCTION_PROCESSING: 'Production Processing',
  PRODUCTION_COMPLETED: 'Production Completed',
  ACCOUNTS_COST_VERIFICATION: 'Accounts Cost Verification',
  ACTUAL_COST_UPDATED: 'Actual Cost Updated',
  ACCOUNTS_FINANCIAL_CLOSURE: 'Accounts Financial Closure',
  ARCHIVED: 'Archived',
  COMPLETED: 'Completed',
};

const STATUS_TONE: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
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

const VarianceIndicator: React.FC<{ value: number | null | undefined }> = ({ value }) => {
  if (value === null || value === undefined) return <span className="text-text-muted">—</span>;
  if (value === 0)
    return (
      <span className="inline-flex items-center gap-1 text-text-muted">
        <Minus size={14} /> Rs.0.00
      </span>
    );
  const Icon = value > 0 ? TrendingUp : TrendingDown;
  const color = value > 0 ? 'text-status-error' : 'text-status-success';
  return (
    <span className={`inline-flex items-center gap-1 ${color}`}>
      <Icon size={14} />
      {value > 0 ? '+' : ''}Rs.
      {Math.abs(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
};

function formatTimestamp(ts: string) {
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

export const CostSheetDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, show, dismiss } = useToasts();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { data: indent, isLoading } = useIndent(id || '');
  const { mutateAsync: saveActualCosts, isPending: isSaving } = useEnterActualCosts();
  const { mutateAsync: financialClose, isPending: isClosing } = useFinancialClose();
  const { mutateAsync: uploadAttachment, isPending: isUploading } = useUploadAttachment();
  const { mutateAsync: downloadAttachment } = useDownloadAttachment();

  const user = useAuthStore((s) => s.user);
  const canViewWorkflow = hasPermission(AppPermission.WORKFLOW_VIEW);
  const { isPrintOpen, openPrint, closePrint } = useUniversalPrint();

  const handleUploadFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = '';
      if (files.length === 0 || !id) return;

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
            id,
            file,
            remarks: 'Vendor bill uploaded by Accounts',
          });
        }
        show(
          'success',
          `${files.length} file${files.length === 1 ? '' : 's'} uploaded successfully!`,
        );
      } catch (error: any) {
        show('error', error?.message || 'Failed to upload vendor bill. Please try again.');
      }
    },
    [id, uploadAttachment, show],
  );

  const isEditable = React.useMemo(() => {
    if (!indent) return false;
    const isCostVerificationState =
      indent.currentState === 'ACCOUNTS_COST_VERIFICATION' ||
      indent.currentState === 'ACTUAL_COST_UPDATED';
    if (!isCostVerificationState) return false;
    const access = getWorkflowAccess(indent.currentState as any, user);
    return access.canEdit;
  }, [indent, user]);

  const [actuals, setActuals] = useState<{
    materials: Record<string, { actualRate: string | number; actualQuantity: string | number }>;
    processes: Record<string, { actualCost: string | number; actualHours: string | number }>;
    broughtMaterials: Record<string, { actualAmount: string | number }>;
  }>({ materials: {}, processes: {}, broughtMaterials: {} });

  const isAccountsStage =
    indent?.currentState === 'ACCOUNTS_COST_VERIFICATION' ||
    indent?.currentState === 'ACTUAL_COST_UPDATED';

  React.useEffect(() => {
    if (indent?.costSheet && isAccountsStage) {
      const matActuals: Record<
        string,
        { actualRate: string | number; actualQuantity: string | number }
      > = {};
      const procActuals: Record<
        string,
        { actualCost: string | number; actualHours: string | number }
      > = {};
      const bmActuals: Record<string, { actualAmount: string | number }> = {};
      indent.costSheet.costItems?.forEach((item) => {
        matActuals[item.id] = {
          actualRate:
            item.actualRate !== null && item.actualRate !== undefined && Number(item.actualRate) > 0
              ? item.actualRate
              : '',
          actualQuantity:
            item.actualQuantity !== null &&
            item.actualQuantity !== undefined &&
            Number(item.actualQuantity) > 0
              ? item.actualQuantity
              : '',
        };
      });
      indent.costSheet.processCosts?.forEach((pc) => {
        procActuals[pc.id] = {
          actualCost:
            pc.actualCost !== null && pc.actualCost !== undefined && Number(pc.actualCost) > 0
              ? pc.actualCost
              : '',
          actualHours:
            pc.actualHours !== null && pc.actualHours !== undefined && Number(pc.actualHours) > 0
              ? pc.actualHours
              : '',
        };
      });
      indent.broughtMaterials?.forEach((bm) => {
        bmActuals[bm.id] = {
          actualAmount:
            bm.actualAmount !== null && bm.actualAmount !== undefined && Number(bm.actualAmount) > 0
              ? bm.actualAmount
              : '',
        };
      });
      setActuals({ materials: matActuals, processes: procActuals, broughtMaterials: bmActuals });
    }
  }, [indent, isAccountsStage]);

  // Keep this hook before the loading/empty early returns so the hook order
  // remains identical while the cost sheet query transitions states.
  const isExecutingRef = React.useRef(false);

  const handleSaveActuals = useCallback(async () => {
    if (!id || !indent || !indent.costSheet || isExecutingRef.current) return;
    isExecutingRef.current = true;
    const currentCs = indent.costSheet;
    const payload = {
      costItems: (currentCs.costItems || []).map((ci) => {
        const itemActual = actuals.materials[ci.id];
        const rawRate =
          itemActual !== undefined && itemActual.actualRate !== ''
            ? itemActual.actualRate
            : ci.actualRate;
        const rawQty =
          itemActual !== undefined && itemActual.actualQuantity !== ''
            ? itemActual.actualQuantity
            : ci.actualQuantity;
        const actualRate =
          rawRate !== undefined && rawRate !== null && rawRate !== '' ? Number(rawRate) : 0;
        const actualQuantity =
          rawQty !== undefined && rawQty !== null && rawQty !== ''
            ? Number(rawQty)
            : actualRate > 0
              ? Number(ci.predictedQuantity || 1)
              : 0;
        return {
          costItemId: ci.id,
          actualRate,
          actualQuantity,
          remarks: ci.remarks || '',
        };
      }),
      processCosts: (currentCs.processCosts || []).map((pc) => {
        const procActual = actuals.processes[pc.id];
        const rawCost =
          procActual !== undefined && procActual.actualCost !== ''
            ? procActual.actualCost
            : pc.actualCost;
        const rawHours =
          procActual !== undefined && procActual.actualHours !== ''
            ? procActual.actualHours
            : pc.actualHours;
        const actualCost =
          rawCost !== undefined && rawCost !== null && rawCost !== '' ? Number(rawCost) : 0;
        const actualHours =
          rawHours !== undefined && rawHours !== null && rawHours !== '' ? Number(rawHours) : 0;
        return {
          processCostId: pc.id,
          actualCost,
          actualHours,
        };
      }),
      broughtMaterials: (indent.broughtMaterials || []).map((bm) => {
        const bmActual = actuals.broughtMaterials[bm.id];
        const rawAmount =
          bmActual !== undefined && bmActual.actualAmount !== ''
            ? bmActual.actualAmount
            : bm.actualAmount;
        const actualAmount =
          rawAmount !== undefined && rawAmount !== null && rawAmount !== '' ? Number(rawAmount) : 0;
        return {
          broughtMaterialId: bm.id,
          actualAmount,
          remarks: 'Actual costs updated via cost sheet',
        };
      }),
      actualDesignCost: Number(currentCs.actualDesignCost ?? 0),
      actualOverheadCost: Number(currentCs.actualOverheadCost ?? 0),
      actualContingencyCost: Number(currentCs.actualContingencyCost ?? 0),
      remarks: 'Actual costs updated via cost sheet',
    };
    try {
      await saveActualCosts({ id, data: payload });
      show('success', 'Actual costs updated successfully!');
    } catch (err: any) {
      show(
        'error',
        err?.response?.data?.message ||
          err?.message ||
          'Failed to save actual costs. Please try again.',
      );
    } finally {
      isExecutingRef.current = false;
    }
  }, [id, indent, actuals, saveActualCosts, show]);

  const handleFinancialClose = useCallback(async () => {
    if (!id || isExecutingRef.current) return;
    isExecutingRef.current = true;
    try {
      await financialClose({
        id,
        data: { closureNotes: 'Financial closure approved', remarks: 'Financial closure approved' },
      });
      show('success', 'Cost Sheet finalized successfully!');
    } catch {
      show('error', 'Failed to finalize cost sheet. Please try again.');
    } finally {
      isExecutingRef.current = false;
    }
  }, [id, financialClose, show]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="flex items-center gap-3 text-text-muted">
          <div className="w-5 h-5 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          Loading cost sheet details...
        </div>
      </div>
    );
  }

  if (!indent || !indent.costSheet) {
    return <div className="flex justify-center p-12 text-status-error">Cost Sheet not found.</div>;
  }

  const cs = indent.costSheet;

  // Real-time dynamic live calculations based on user input (fallback to saved values)
  const dynamicCostItems = (cs.costItems || []).map((item) => {
    const rawRate = isEditable ? actuals.materials[item.id]?.actualRate : item.actualRate;
    const rawQty = isEditable ? actuals.materials[item.id]?.actualQuantity : item.actualQuantity;

    const hasRate = rawRate !== undefined && rawRate !== null && rawRate !== '';
    const hasQty = rawQty !== undefined && rawQty !== null && rawQty !== '';

    const liveActualRate = hasRate
      ? Number(rawRate)
      : item.actualRate !== null && item.actualRate !== undefined && Number(item.actualRate) > 0
        ? Number(item.actualRate)
        : null;
    const liveActualQty = hasQty
      ? Number(rawQty)
      : item.actualQuantity !== null &&
          item.actualQuantity !== undefined &&
          Number(item.actualQuantity) > 0
        ? Number(item.actualQuantity)
        : hasRate
          ? Number(item.predictedQuantity || 1)
          : null;

    const hasActual = liveActualRate !== null;
    const liveActualAmount = hasActual
      ? liveActualRate * (liveActualQty ?? Number(item.predictedQuantity || 1))
      : null;
    const liveVariance =
      hasActual && liveActualAmount !== null
        ? liveActualAmount - Number(item.predictedAmount || 0)
        : null;

    return {
      ...item,
      actualRate: liveActualRate ?? undefined,
      actualQuantity: liveActualQty ?? undefined,
      actualAmount: liveActualAmount ?? undefined,
      variance: liveVariance ?? undefined,
      hasActual,
    };
  });

  const dynamicProcessCosts = (cs.processCosts || []).map((pc) => {
    const rawCost = isEditable ? actuals.processes[pc.id]?.actualCost : pc.actualCost;
    const rawHours = isEditable ? actuals.processes[pc.id]?.actualHours : pc.actualHours;

    const hasCost = rawCost !== undefined && rawCost !== null && rawCost !== '';
    const hasHours = rawHours !== undefined && rawHours !== null && rawHours !== '';

    const liveActualCost = hasCost
      ? Number(rawCost)
      : pc.actualCost !== null && pc.actualCost !== undefined && Number(pc.actualCost) > 0
        ? Number(pc.actualCost)
        : null;
    const liveActualHours = hasHours
      ? Number(rawHours)
      : pc.actualHours !== null && pc.actualHours !== undefined && Number(pc.actualHours) > 0
        ? Number(pc.actualHours)
        : null;

    const hasActual = liveActualCost !== null || liveActualHours !== null;
    const liveVariance =
      liveActualCost !== null ? liveActualCost - Number(pc.predictedCost || 0) : null;

    return {
      ...pc,
      actualCost: liveActualCost ?? undefined,
      actualHours: liveActualHours ?? undefined,
      variance: liveVariance ?? undefined,
      hasActual,
    };
  });

  const dynamicBroughtMaterials = (indent.broughtMaterials || []).map((item) => {
    const rawAmount = isEditable
      ? actuals.broughtMaterials[item.id]?.actualAmount
      : item.actualAmount;
    const hasAmount = rawAmount !== undefined && rawAmount !== null && rawAmount !== '';

    const liveActualAmount = hasAmount
      ? Number(rawAmount)
      : item.actualAmount !== null &&
          item.actualAmount !== undefined &&
          Number(item.actualAmount) > 0
        ? Number(item.actualAmount)
        : null;
    const hasActual = liveActualAmount !== null;
    const liveVariance =
      hasActual && liveActualAmount !== null ? liveActualAmount - Number(item.amount || 0) : null;

    return {
      ...item,
      actualAmount: liveActualAmount ?? undefined,
      variance: liveVariance ?? undefined,
      hasActual,
    };
  });

  const hasAnyActuals =
    dynamicCostItems.some((i) => i.hasActual) ||
    dynamicProcessCosts.some((i) => i.hasActual) ||
    dynamicBroughtMaterials.some((i) => i.hasActual) ||
    (cs.actualTotal !== null && cs.actualTotal !== undefined && Number(cs.actualTotal) > 0);

  const plannedMaterialCost =
    (cs.costItems?.reduce((a, c) => a + (Number(c.predictedAmount) || 0), 0) || 0) +
    (indent.broughtMaterials?.reduce((a, c) => a + (Number(c.amount) || 0), 0) || 0);

  const actualMaterialCost =
    dynamicCostItems.reduce(
      (a, c) => a + (c.actualAmount !== null ? Number(c.actualAmount) : 0),
      0,
    ) +
    dynamicBroughtMaterials.reduce(
      (a, c) => a + (c.actualAmount !== null ? Number(c.actualAmount) : 0),
      0,
    );

  const hasMaterialActuals =
    dynamicCostItems.some((i) => i.hasActual) || dynamicBroughtMaterials.some((i) => i.hasActual);
  const materialVariance = hasMaterialActuals ? actualMaterialCost - plannedMaterialCost : null;

  const plannedProcessCost =
    cs.processCosts?.reduce((a, c) => a + (Number(c.predictedCost) || 0), 0) || 0;

  const actualProcessCost = dynamicProcessCosts.reduce(
    (a, c) => a + (c.actualCost !== null ? Number(c.actualCost) : 0),
    0,
  );
  const hasProcessActuals = dynamicProcessCosts.some((i) => i.hasActual);
  const processVariance = hasProcessActuals ? actualProcessCost - plannedProcessCost : null;

  const plannedTotal =
    Number(cs.predictedTotal) ||
    plannedMaterialCost +
      plannedProcessCost +
      Number(cs.designCost || 0) +
      Number(cs.overheadCost || 0) +
      Number(cs.contingencyCost || 0);

  const actualTotal = hasAnyActuals
    ? actualMaterialCost +
      actualProcessCost +
      Number(cs.actualDesignCost || 0) +
      Number(cs.actualOverheadCost || 0) +
      Number(cs.actualContingencyCost || 0)
    : 0;

  const totalVariance = hasAnyActuals ? actualTotal - plannedTotal : null;
  const totalVariancePercentage =
    hasAnyActuals && plannedTotal > 0 ? ((totalVariance ?? 0) / plannedTotal) * 100 : null;

  const dynamicCostSheet = {
    ...cs,
    predictedTotal: plannedTotal,
    actualTotal: hasAnyActuals ? actualTotal : (cs.actualTotal ?? 0),
    varianceAmount: totalVariance ?? 0,
    variancePercentage: totalVariancePercentage ?? 0,
    hasActualCostsEntered: hasAnyActuals,
    costItems: dynamicCostItems,
    processCosts: dynamicProcessCosts,
  };

  return (
    <div className="space-y-6">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/cost-sheets')}
            className="p-2"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">Cost Sheet {cs.costNumber}</h1>
              <Badge tone={STATUS_TONE[indent.currentState] ?? 'gray'}>
                {WORKFLOW_STATE_LABELS[indent.currentState] || indent.currentState}
              </Badge>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Indent {indent.indentNumber} &middot; {indent.productName || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openPrint}
            className="flex items-center gap-2"
          >
            <Printer size={16} /> Print Sheet
          </Button>
          {isEditable && (
            <>
              {/* BIZ-001: Save Actuals button is available in both cost-entry states */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveActuals}
                loading={isSaving}
                className="flex items-center gap-2"
              >
                <Save size={16} /> Save Actuals
              </Button>
              {/* BIZ-001: Financial Closure is ONLY available after actual costs have been
                  submitted (ACTUAL_COST_UPDATED). It must NOT appear during
                  ACCOUNTS_COST_VERIFICATION to prevent bypassing the cost-entry step. */}
              {indent?.currentState === 'ACTUAL_COST_UPDATED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleFinancialClose}
                  loading={isClosing}
                  className="flex items-center gap-2"
                >
                  <CheckCircle size={16} /> Finalize Closure
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Universal Print Modal */}
      <UniversalPrintModal
        isOpen={isPrintOpen}
        onClose={closePrint}
        title={`Cost Sheet: ${cs.costNumber}`}
        orientation="portrait"
      >
        <SingleCostSheetPrintSheet indent={indent} />
      </UniversalPrintModal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialSummaryWidget costSheet={dynamicCostSheet} />
        <CostBreakdownChart costSheet={dynamicCostSheet} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
            Material Variance
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="break-all">
              <VarianceIndicator value={materialVariance} />
            </div>
            <span className="text-xs text-text-muted">
              {plannedMaterialCost > 0 && materialVariance !== null
                ? `${((materialVariance / plannedMaterialCost) * 100).toFixed(1)}%`
                : '--'}
            </span>
          </div>
        </div>
        <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
            Process Variance
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="break-all">
              <VarianceIndicator value={processVariance} />
            </div>
            <span className="text-xs text-text-muted">
              {plannedProcessCost > 0 && processVariance !== null
                ? `${((processVariance / plannedProcessCost) * 100).toFixed(1)}%`
                : '--'}
            </span>
          </div>
        </div>
        <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
            Total Variance
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="break-all">
              <VarianceIndicator value={totalVariance} />
            </div>
            <span className="text-xs text-text-muted">
              {plannedTotal > 0 && totalVariance !== null && totalVariancePercentage !== null
                ? `${totalVariancePercentage.toFixed(1)}%`
                : '--'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-accent-primary" />
          <h3 className="text-lg font-bold text-text-primary">Material Costs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-default text-text-muted font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Part Name / Product</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Planned Qty</th>
                <th className="py-3 px-4">Planned Rate</th>
                <th className="py-3 px-4">Planned Amt</th>
                <th className="py-3 px-4 bg-surface-elevated/50 rounded-tl-md">Actual Qty</th>
                <th className="py-3 px-4 bg-surface-elevated/50">Actual Rate</th>
                <th className="py-3 px-4 bg-surface-elevated/50">Actual Amt</th>
                <th className="py-3 px-4 bg-surface-elevated/50 rounded-tr-md">Variance</th>
              </tr>
            </thead>
            <tbody>
              {dynamicCostItems.map((item, index) => {
                const indentItem = indent?.items?.[index];
                const parsed = indentItem ? parseItemRemarks(indentItem.remarks) : {};
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border-default/50 hover:bg-background-primary/50 text-sm"
                  >
                    <td className="py-3 px-4 font-medium text-text-primary">
                      {parsed.product || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {item.material?.materialName || `Material #${item.materialId}`}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{parsed.size || '—'}</td>
                    <td className="py-3 px-4">{item.predictedQuantity}</td>
                    <td className="py-3 px-4">Rs.{item.predictedRate}</td>
                    <td className="py-3 px-4">
                      Rs.{Number(item.predictedAmount).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 bg-surface-elevated/20">
                      {isEditable ? (
                        <Input
                          type="number"
                          className="w-24 text-sm h-8"
                          placeholder="—"
                          value={actuals.materials[item.id]?.actualQuantity ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setActuals((prev) => ({
                              ...prev,
                              materials: {
                                ...prev.materials,
                                [item.id]: {
                                  actualRate: prev.materials[item.id]?.actualRate ?? '',
                                  actualQuantity: val,
                                },
                              },
                            }));
                          }}
                        />
                      ) : (
                        <span>
                          {item.actualQuantity !== null && item.actualQuantity !== undefined
                            ? item.actualQuantity
                            : '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 bg-surface-elevated/20">
                      {isEditable ? (
                        <Input
                          type="number"
                          className="w-24 text-sm h-8"
                          placeholder="—"
                          value={actuals.materials[item.id]?.actualRate ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setActuals((prev) => ({
                              ...prev,
                              materials: {
                                ...prev.materials,
                                [item.id]: {
                                  actualQuantity: prev.materials[item.id]?.actualQuantity ?? '',
                                  actualRate: val,
                                },
                              },
                            }));
                          }}
                        />
                      ) : (
                        <span>
                          {item.actualRate !== null && item.actualRate !== undefined
                            ? `Rs.${item.actualRate}`
                            : '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium bg-surface-elevated/20 text-accent-primary">
                      {item.actualAmount !== null && item.actualAmount !== undefined
                        ? `Rs.${Number(item.actualAmount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 bg-surface-elevated/20">
                      <VarianceIndicator value={item.variance} />
                    </td>
                  </tr>
                );
              })}
              {(!cs.costItems || cs.costItems.length === 0) && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-text-muted">
                    No material costs recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-indigo-500" />
          <h3 className="text-lg font-bold text-text-primary">Manufacturing Process Costs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-default text-text-muted font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Process</th>
                <th className="py-3 px-4">Planned Hours</th>
                <th className="py-3 px-4">Planned Cost</th>
                <th className="py-3 px-4 bg-surface-elevated/50 rounded-tl-md">Actual Hours</th>
                <th className="py-3 px-4 bg-surface-elevated/50">Actual Cost</th>
                <th className="py-3 px-4 bg-surface-elevated/50 rounded-tr-md">Variance</th>
              </tr>
            </thead>
            <tbody>
              {dynamicProcessCosts.map((item) => {
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border-default/50 hover:bg-background-primary/50 text-sm"
                  >
                    <td className="py-3 px-4 font-medium text-text-primary">
                      {item.process?.processName || `Process #${item.processId}`}
                    </td>
                    <td className="py-3 px-4">{item.estimatedHours}</td>
                    <td className="py-3 px-4">Rs.{Number(item.predictedCost).toLocaleString()}</td>
                    <td className="py-2 px-4 bg-surface-elevated/20">
                      {isEditable ? (
                        <Input
                          type="number"
                          className="w-24 text-sm h-8"
                          placeholder="—"
                          value={actuals.processes[item.id]?.actualHours ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setActuals((prev) => ({
                              ...prev,
                              processes: {
                                ...prev.processes,
                                [item.id]: {
                                  actualCost: prev.processes[item.id]?.actualCost ?? '',
                                  actualHours: val,
                                },
                              },
                            }));
                          }}
                        />
                      ) : (
                        <span>
                          {item.actualHours !== null && item.actualHours !== undefined
                            ? `${item.actualHours} hrs`
                            : '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 bg-surface-elevated/20">
                      {isEditable ? (
                        <Input
                          type="number"
                          className="w-32 text-sm h-8"
                          placeholder="—"
                          value={actuals.processes[item.id]?.actualCost ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setActuals((prev) => ({
                              ...prev,
                              processes: {
                                ...prev.processes,
                                [item.id]: {
                                  actualHours: prev.processes[item.id]?.actualHours ?? '',
                                  actualCost: val,
                                },
                              },
                            }));
                          }}
                        />
                      ) : (
                        <span className="font-medium text-indigo-500">
                          {item.actualCost !== null && item.actualCost !== undefined
                            ? `Rs.${Number(item.actualCost).toLocaleString()}`
                            : '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 bg-surface-elevated/20">
                      <VarianceIndicator value={item.variance} />
                    </td>
                  </tr>
                );
              })}
              {(!cs.processCosts || cs.processCosts.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    No process costs recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {indent.broughtMaterials && indent.broughtMaterials.length > 0 && (
        <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-teal-500" />
            <h3 className="text-lg font-bold text-text-primary">
              Brought Material Costs (Bought Out Items)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-default text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Specification</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Estimated Amount</th>
                  <th className="py-3 px-4 bg-surface-elevated/50">Actual Amount</th>
                  <th className="py-3 px-4 bg-surface-elevated/50 rounded-tr-md">Variance</th>
                </tr>
              </thead>
              <tbody>
                {dynamicBroughtMaterials.map((item) => {
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border-default/50 hover:bg-background-primary/50 text-sm"
                    >
                      <td className="py-3 px-4 font-medium text-text-primary">{item.name}</td>
                      <td className="py-3 px-4">{item.specification || '—'}</td>
                      <td className="py-3 px-4">{item.quantity}</td>
                      <td className="py-3 px-4">
                        Rs.{(Number(item.amount) || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-4 bg-surface-elevated/20">
                        {isEditable ? (
                          <Input
                            type="number"
                            className="w-32 text-sm h-8"
                            placeholder="—"
                            value={actuals.broughtMaterials[item.id]?.actualAmount ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setActuals((prev) => ({
                                ...prev,
                                broughtMaterials: {
                                  ...prev.broughtMaterials,
                                  [item.id]: {
                                    actualAmount: val,
                                  },
                                },
                              }));
                            }}
                          />
                        ) : (
                          <span className="font-medium text-teal-500">
                            {item.actualAmount !== undefined && item.actualAmount !== null
                              ? `Rs.${Number(item.actualAmount).toLocaleString()}`
                              : '—'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 bg-surface-elevated/20">
                        <VarianceIndicator value={item.variance} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {canViewWorkflow && indent.workflowHistory && indent.workflowHistory.length > 0 && (
        <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
          <div className="flex items-center gap-2 mb-6">
            <Clock size={18} className="text-accent-primary" />
            <h3 className="text-lg font-bold text-text-primary">Workflow History</h3>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border-default" />
            <div className="space-y-6">
              {indent.workflowHistory.map((entry, index) => (
                <div key={entry.id} className="relative flex gap-4 pl-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 ${index === 0 ? 'bg-accent-primary border-accent-primary text-white' : 'bg-surface-card border-border-default text-text-muted'}`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary">
                        {WORKFLOW_STATE_LABELS[entry.toDepartment?.name || ''] ||
                          entry.toDepartment?.name ||
                          'State Change'}
                      </p>
                      <span className="text-xs text-text-muted">
                        {formatTimestamp(entry.movedAt)}
                      </span>
                    </div>
                    {entry.mover && (
                      <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                        <User size={12} /> {entry.mover.firstName} {entry.mover.lastName}
                      </p>
                    )}
                    {entry.remarks && (
                      <p className="text-xs text-text-muted mt-1 italic">"{entry.remarks}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {((indent.attachments && indent.attachments.length > 0) || isEditable) && (
        <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border-default pb-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-accent-primary" />
              <h3 className="text-lg font-bold text-text-primary">
                Attachments ({indent.attachments?.length ?? 0})
              </h3>
            </div>
          </div>

          {/* Upload Widget for Accounts Stage */}
          {isEditable && (
            <div className="p-4 border border-dashed border-border-default rounded-xl bg-background-primary/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <p className="text-sm font-semibold text-text-primary">
                  Upload Vendor Bill / Invoice
                </p>
                <p className="text-xs text-text-muted">
                  Select a PDF or image file detailing the process cost invoices.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="vendor-bill-upload"
                  accept=".pdf,.xlsx,.xls"
                  multiple
                  className="hidden"
                  onChange={handleUploadFile}
                  disabled={isUploading}
                />
                <label
                  htmlFor="vendor-bill-upload"
                  className="inline-flex items-center justify-center rounded-lg text-xs font-semibold h-9 px-4 border border-border-default bg-surface-card hover:bg-background-secondary text-text-primary cursor-pointer transition-colors"
                >
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </label>
              </div>
            </div>
          )}

          {indent.attachments && indent.attachments.length > 0 && (
            <div className="space-y-2">
              {indent.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 bg-background-primary rounded-lg border border-border-default/50 hover:border-accent-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={18} className="text-accent-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {att.fileName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {att.fileType} &middot; {formatTimestamp(att.createdAt)}
                        {att.remarks && ` -- ${att.remarks}`}
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
                        show('success', `Downloaded "${att.fileName}" successfully.`);
                      } catch (err: any) {
                        show('error', err?.message || `Failed to download "${att.fileName}".`);
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
          )}
        </div>
      )}
    </div>
  );
};
