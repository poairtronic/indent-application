import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useIndent,
  useEnterActualCosts,
  useFinancialClose,
} from '../../api/services/indents/hooks';
import { ArrowLeft, Save, FileText, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FinancialSummaryWidget } from './components/FinancialSummaryWidget';
import { CostBreakdownChart } from './components/CostBreakdownChart';
import { Input } from '../../components/ui/Input';
import { ToastViewport, useToasts } from '../../components/ui/toast';

export const CostSheetDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, show, dismiss } = useToasts();
  const { data: indent, isLoading } = useIndent(id || '');
  const { mutateAsync: saveActualCosts, isPending: isSaving } = useEnterActualCosts();
  const { mutateAsync: financialClose, isPending: isClosing } = useFinancialClose();

  const [actuals, setActuals] = useState<{
    materials: Record<string, { actualRate: number; actualQuantity: number }>;
    processes: Record<string, { actualCost: number; actualHours: number }>;
  }>({
    materials: {},
    processes: {},
  });

  const isAccountsStage =
    indent?.currentState === 'ACCOUNTS_COST_VERIFICATION' ||
    indent?.currentState === 'ACTUAL_COST_UPDATED';

  // Initialize actuals form state when data loads
  React.useEffect(() => {
    if (indent?.costSheet && isAccountsStage) {
      const matActuals: Record<string, { actualRate: number; actualQuantity: number }> = {};
      const procActuals: Record<string, { actualCost: number; actualHours: number }> = {};

      indent.costSheet.costItems?.forEach((item) => {
        matActuals[item.id] = {
          actualRate: item.actualRate || item.predictedRate || 0,
          actualQuantity: item.actualQuantity || item.predictedQuantity || 0,
        };
      });

      indent.costSheet.processCosts?.forEach((pc) => {
        procActuals[pc.id] = {
          actualCost: pc.actualCost || pc.predictedCost || 0,
          actualHours: pc.actualHours || pc.estimatedHours || 0,
        };
      });

      setActuals({ materials: matActuals, processes: procActuals });
    }
  }, [indent, isAccountsStage]);

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

  const handleSaveActuals = async () => {
    if (!id) return;

    const payload = {
      costItems: Object.entries(actuals.materials).map(([costItemId, vals]) => ({
        costItemId,
        actualRate: vals.actualRate,
        actualQuantity: vals.actualQuantity,
      })),
      processCosts: Object.entries(actuals.processes).map(([processCostId, vals]) => ({
        processCostId,
        actualCost: vals.actualCost,
        actualHours: vals.actualHours,
      })),
      remarks: 'Actual costs updated',
    };

    try {
      await saveActualCosts({ id, data: payload });
      show('success', 'Actual costs updated successfully!');
    } catch {
      show('error', 'Failed to save actual costs. Please try again.');
    }
  };

  const handleFinancialClose = async () => {
    if (!id) return;

    try {
      await financialClose({
        id,
        data: { closureNotes: 'Financial closure approved', remarks: 'Financial closure approved' },
      });
      show('success', 'Cost Sheet finalized successfully!');
    } catch {
      show('error', 'Failed to finalize cost sheet. Please try again.');
    }
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
            <h1 className="text-2xl font-bold text-text-primary">
              Cost Sheet {indent.costSheet.costNumber}
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Associated with Indent {indent.indentNumber}
            </p>
          </div>
        </div>

        {isAccountsStage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveActuals}
              loading={isSaving}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              Save Draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleFinancialClose}
              loading={isClosing}
              className="flex items-center gap-2"
            >
              <CheckCircle size={16} />
              Finalize Closure
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialSummaryWidget costSheet={indent.costSheet} />
        <CostBreakdownChart costSheet={indent.costSheet} />
      </div>

      {/* Material Costs Table */}
      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-accent-primary" />
          <h3 className="text-lg font-bold text-text-primary">Material Costs</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-default text-text-muted font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4">Planned Qty</th>
                <th className="py-3 px-4">Planned Rate</th>
                <th className="py-3 px-4">Planned Amt</th>
                <th className="py-3 px-4 bg-surface-elevated/50 rounded-tl-md">Actual Qty</th>
                <th className="py-3 px-4 bg-surface-elevated/50">Actual Rate</th>
                <th className="py-3 px-4 bg-surface-elevated/50 rounded-tr-md">Actual Amt</th>
              </tr>
            </thead>
            <tbody>
              {indent.costSheet.costItems?.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border-default/50 hover:bg-background-primary/50 text-sm"
                >
                  <td className="py-3 px-4 font-medium text-text-primary">
                    {item.material?.materialName || `Material #${item.materialId}`}
                  </td>
                  <td className="py-3 px-4">{item.predictedQuantity}</td>
                  <td className="py-3 px-4">₹{item.predictedRate}</td>
                  <td className="py-3 px-4">₹{item.predictedAmount}</td>

                  <td className="py-2 px-4 bg-surface-elevated/20">
                    {isAccountsStage ? (
                      <Input
                        type="number"
                        className="w-24 text-sm h-8"
                        value={actuals.materials[item.id]?.actualQuantity || ''}
                        onChange={(e) =>
                          setActuals((prev) => ({
                            ...prev,
                            materials: {
                              ...prev.materials,
                              [item.id]: {
                                ...prev.materials[item.id],
                                actualQuantity: parseFloat(e.target.value) || 0,
                              },
                            },
                          }))
                        }
                      />
                    ) : (
                      <span>{item.actualQuantity || '—'}</span>
                    )}
                  </td>
                  <td className="py-2 px-4 bg-surface-elevated/20">
                    {isAccountsStage ? (
                      <Input
                        type="number"
                        className="w-24 text-sm h-8"
                        value={actuals.materials[item.id]?.actualRate || ''}
                        onChange={(e) =>
                          setActuals((prev) => ({
                            ...prev,
                            materials: {
                              ...prev.materials,
                              [item.id]: {
                                ...prev.materials[item.id],
                                actualRate: parseFloat(e.target.value) || 0,
                              },
                            },
                          }))
                        }
                      />
                    ) : (
                      <span>{item.actualRate ? `₹${item.actualRate}` : '—'}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium bg-surface-elevated/20 text-accent-primary">
                    {isAccountsStage
                      ? `₹${((actuals.materials[item.id]?.actualRate || 0) * (actuals.materials[item.id]?.actualQuantity || 0)).toFixed(2)}`
                      : item.actualAmount
                        ? `₹${item.actualAmount}`
                        : '—'}
                  </td>
                </tr>
              ))}
              {(!indent.costSheet.costItems || indent.costSheet.costItems.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-muted">
                    No material costs recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Costs Table */}
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
                <th className="py-3 px-4 bg-surface-elevated/50 rounded-tr-md">Actual Cost</th>
              </tr>
            </thead>
            <tbody>
              {indent.costSheet.processCosts?.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border-default/50 hover:bg-background-primary/50 text-sm"
                >
                  <td className="py-3 px-4 font-medium text-text-primary">
                    {item.process?.processName || `Process #${item.processId}`}
                  </td>
                  <td className="py-3 px-4">{item.estimatedHours}</td>
                  <td className="py-3 px-4">₹{item.predictedCost}</td>

                  <td className="py-2 px-4 bg-surface-elevated/20">
                    {isAccountsStage ? (
                      <Input
                        type="number"
                        className="w-24 text-sm h-8"
                        value={actuals.processes[item.id]?.actualHours || ''}
                        onChange={(e) =>
                          setActuals((prev) => ({
                            ...prev,
                            processes: {
                              ...prev.processes,
                              [item.id]: {
                                ...prev.processes[item.id],
                                actualHours: parseFloat(e.target.value) || 0,
                              },
                            },
                          }))
                        }
                      />
                    ) : (
                      <span>{item.actualHours || '—'}</span>
                    )}
                  </td>
                  <td className="py-2 px-4 bg-surface-elevated/20">
                    {isAccountsStage ? (
                      <Input
                        type="number"
                        className="w-32 text-sm h-8"
                        value={actuals.processes[item.id]?.actualCost || ''}
                        onChange={(e) =>
                          setActuals((prev) => ({
                            ...prev,
                            processes: {
                              ...prev.processes,
                              [item.id]: {
                                ...prev.processes[item.id],
                                actualCost: parseFloat(e.target.value) || 0,
                              },
                            },
                          }))
                        }
                      />
                    ) : (
                      <span className="font-medium text-indigo-500">
                        {item.actualCost ? `₹${item.actualCost}` : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {(!indent.costSheet.processCosts || indent.costSheet.processCosts.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    No process costs recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
