import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Priority } from '../../../types/indent';
import { useUnits } from '../../../api/services/units/hooks';
import { useProcesses } from '../../../api/services/processes/hooks';
import type { IndentData } from '../../../api/services/indents/service';
import { useAuthStore } from '../../../store/authStore';
import { getWorkflowAccess } from '../../../constants/workflow';

export interface ParsedRemarks {
  product?: string;
  size?: string;
  weight?: string;
  source?: string;
  productionSource?: string;
  userRemarks?: string;
  processSources?: string[];
  processProductionSources?: string[];
}

export function parseItemRemarks(remarks: string | null | undefined): ParsedRemarks {
  if (!remarks)
    return {
      product: '',
      size: '',
      weight: '',
      source: '',
      productionSource: '',
      userRemarks: '',
      processSources: [],
    };
  try {
    const parsed = JSON.parse(remarks);
    if (parsed && typeof parsed === 'object') {
      return {
        product: parsed.product || '',
        size: parsed.size || '',
        weight: parsed.weight || '',
        source: parsed.source || '',
        productionSource: parsed.productionSource || '',
        userRemarks: parsed.userRemarks || '',
        processSources: parsed.processSources || [],
        processProductionSources: parsed.processProductionSources || [],
      };
    }
  } catch {
    // Legacy remarks
  }
  return {
    product: '',
    size: '',
    weight: '',
    source: '',
    productionSource: '',
    userRemarks: remarks,
    processSources: [],
  };
}

export interface ParsedIndentRemarks {
  layoutNumber?: string;
  customerName?: string;
  userRemarks?: string;
  designCost?: number;
  overheadCost?: number;
  contingencyCost?: number;
  actualDesignCost?: number;
  actualOverheadCost?: number;
  actualContingencyCost?: number;
  itemProcessCosts?: Array<Array<{ processId: string; predictedCost: number }>>;
}

export function parseIndentRemarks(remarks: string | null | undefined): ParsedIndentRemarks {
  if (!remarks) return { layoutNumber: '', customerName: '', userRemarks: '' };

  let jsonPart = remarks;

  const firstNewline = remarks.indexOf('\n');
  if (firstNewline !== -1) {
    jsonPart = remarks.substring(0, firstNewline).trim();
  }

  const verificationIndex = jsonPart.indexOf('Stock Verification Results:');
  if (verificationIndex !== -1) {
    jsonPart = jsonPart.substring(0, verificationIndex).trim();
  }

  try {
    const parsed = JSON.parse(jsonPart);
    if (parsed && typeof parsed === 'object') {
      return {
        layoutNumber: parsed.layoutNumber || '',
        customerName: parsed.customerName || '',
        userRemarks: parsed.userRemarks || '',
        designCost: Number(parsed.designCost) || 0,
        overheadCost: Number(parsed.overheadCost) || 0,
        contingencyCost: Number(parsed.contingencyCost) || 0,
        actualDesignCost: Number(parsed.actualDesignCost) || 0,
        actualOverheadCost: Number(parsed.actualOverheadCost) || 0,
        actualContingencyCost: Number(parsed.actualContingencyCost) || 0,
        itemProcessCosts: Array.isArray(parsed.itemProcessCosts) ? parsed.itemProcessCosts : [],
      };
    }
  } catch {
    // Fallback to legacy
  }
  return { layoutNumber: '', customerName: '', userRemarks: remarks };
}

const indentSchema = z
  .object({
    indent: z.object({
      productName: z.string().optional(),
      departmentName: z.string().optional(),
      priority: z.nativeEnum(Priority),
      requiredDate: z.string().min(1, 'Required date is required'),
      purpose: z.string().trim().min(1, 'PO number is required'), // Labeled as PO Number in UI
      layoutNumber: z.string().trim().min(1, 'Layout number is required'),
      customerName: z.string().trim().min(1, 'Customer name is required'),
      remarks: z.string().optional(),
      items: z
        .array(
          z.object({
            product: z.string().trim().min(1, 'Part Name / Product is required'),
            materialName: z.string().trim().min(1, 'Material is required'),
            size: z.string().trim().optional(),
            weight: z.string().trim().optional(),
            quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
            unitId: z.string().uuid('Please select a valid unit'),
            source: z.string().trim().optional(),
            productionSource: z.string().trim().optional(),
            remarks: z.string().trim().optional(),
            processes: z
              .array(
                z.object({
                  processId: z.string().uuid('Please select an existing process'),
                  predictedCost: z.number().min(0, 'Cost must be >= 0'),
                  estimatedHours: z.number().min(0, 'Hours must be >= 0'),
                  actualCost: z.number().min(0).optional(),
                  actualHours: z.number().min(0).optional(),
                  vendorType: z.string().optional(),
                  productionSource: z.string().optional(),
                }),
              )
              .optional(),
          }),
        )
        .min(1, 'At least one material is required'),
    }),
    costSheet: z.object({
      predictedTotal: z.number(),
      designCost: z.number().min(0).optional(),
      overheadCost: z.number().min(0).optional(),
      contingencyCost: z.number().min(0).optional(),
      actualDesignCost: z.number().min(0).optional(),
      actualOverheadCost: z.number().min(0).optional(),
      actualContingencyCost: z.number().min(0).optional(),
      actualTotal: z.number().optional(),
      costItems: z.array(
        z.object({
          materialName: z.string(),
          predictedRate: z.number().min(0, 'Rate must be >= 0'),
          predictedQuantity: z.number(),
          predictedAmount: z.number(),
          actualRate: z.number().min(0).optional(),
          actualAmount: z.number().optional(),
        }),
      ),
    }),
  })
  .superRefine((data, ctx) => {
    const totalProcesses = data.indent.items.reduce(
      (sum, item) => sum + (item.processes?.length || 0),
      0,
    );
    if (totalProcesses === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one manufacturing process is required across all items.',
        path: ['indent', 'items'],
      });
    }
  });

type IndentFormData = z.infer<typeof indentSchema>;

interface IndentFormProps {
  initialData?: IndentData;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  forceReadOnly?: boolean;
  isAccountsMode?: boolean;
  isProductionMode?: boolean;
}

const NestedProcessArray: React.FC<{
  control: Control<IndentFormData>;
  register: any;
  itemIndex: number;
  errors: any;
  isReadOnly: boolean;
  isAccountsMode?: boolean;
  isProductionMode?: boolean;
  processesList: any[];
  itemTotal: { predicted: number; actual: number };
}> = ({
  control,
  register,
  itemIndex,
  errors,
  isReadOnly,
  isAccountsMode,
  isProductionMode,
  processesList,
  itemTotal,
}) => {
  const user = useAuthStore((s) => s.user);
  const canViewCostSheet = !!(
    user?.permissions?.includes('costsheet.view') || user?.permissions?.includes('settings.manage')
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name: `indent.items.${itemIndex}.processes`,
  });

  return (
    <div className="mt-4 p-4 bg-surface-base rounded border border-border-default">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-bold text-text-secondary uppercase">Manufacturing Processes</h4>
        {!isReadOnly && !isProductionMode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                processId: '',
                predictedCost: 0,
                estimatedHours: 0,
                vendorType: '',
                productionSource: '',
              })
            }
          >
            Add Process
          </Button>
        )}
      </div>
      {errors?.indent?.items?.[itemIndex]?.processes?.message && (
        <p className="text-xs text-status-error mb-2">
          {errors.indent.items[itemIndex].processes.message}
        </p>
      )}
      {fields.length === 0 && (
        <p className="text-xs text-text-muted italic">No processes added for this item.</p>
      )}
      <div className="space-y-3">
        {fields.map((field, pIndex) => {
          const showActual = isAccountsMode || field.actualCost !== undefined;
          let processCol = 'md:col-span-3';
          let sourceCol = 'md:col-span-2';
          let prodSourceCol = 'md:col-span-2';
          let hoursCol = 'md:col-span-2';
          let plannedCol = 'md:col-span-2';
          let actualCol = 'md:col-span-1';

          if (!canViewCostSheet) {
            processCol = 'md:col-span-4';
            sourceCol = 'md:col-span-3';
            prodSourceCol = 'md:col-span-3';
            hoursCol = 'md:col-span-2';
          } else if (showActual) {
            processCol = 'md:col-span-2';
            sourceCol = 'md:col-span-2';
            prodSourceCol = 'md:col-span-2';
            hoursCol = 'md:col-span-2';
            plannedCol = 'md:col-span-2';
            actualCol = 'md:col-span-2';
          } else if (isReadOnly) {
            processCol = 'md:col-span-3';
            sourceCol = 'md:col-span-2';
            prodSourceCol = 'md:col-span-3';
            hoursCol = 'md:col-span-2';
            plannedCol = 'md:col-span-2';
          }

          return (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className={processCol}>
                <Controller
                  control={control}
                  name={`indent.items.${itemIndex}.processes.${pIndex}.processId`}
                  render={({ field }) => {
                    const selectedProcess = processesList.find((p) => p.id === field.value);
                    const fallbackName =
                      (field as any).processName || (fields[pIndex] as any).processName;
                    const inputValue = selectedProcess
                      ? selectedProcess.processName
                      : fallbackName || field.value || '';
                    return (
                      <div className="w-full font-sans">
                        <Input
                          label="Process"
                          placeholder="Type or select process"
                          value={inputValue}
                          list={`processes-datalist-${itemIndex}-${pIndex}`}
                          disabled={isReadOnly || isProductionMode}
                          onChange={(e) => {
                            const val = e.target.value;
                            const matched = processesList.find(
                              (p) => p.processName.toLowerCase() === val.toLowerCase(),
                            );
                            field.onChange(matched ? matched.id : val);
                          }}
                          error={
                            errors.indent?.items?.[itemIndex]?.processes?.[pIndex]?.processId
                              ?.message
                              ? 'Please select an existing process from the list'
                              : undefined
                          }
                        />
                        <datalist id={`processes-datalist-${itemIndex}-${pIndex}`}>
                          {processesList.map((p) => (
                            <option key={p.id} value={p.processName} />
                          ))}
                        </datalist>
                      </div>
                    );
                  }}
                />
              </div>
              <div className={sourceCol}>
                <Input
                  label="Source"
                  placeholder="e.g. In-house"
                  disabled={isReadOnly || isProductionMode}
                  {...register(`indent.items.${itemIndex}.processes.${pIndex}.vendorType`)}
                  error={
                    errors.indent?.items?.[itemIndex]?.processes?.[pIndex]?.vendorType?.message
                  }
                />
              </div>
              <div className={prodSourceCol}>
                <Input
                  label="Prod. Source"
                  placeholder="e.g. Supplier XYZ"
                  disabled={!isProductionMode}
                  {...register(`indent.items.${itemIndex}.processes.${pIndex}.productionSource`)}
                />
              </div>
              <div className={hoursCol}>
                <Input
                  label="Est. Hours"
                  type="number"
                  step="0.5"
                  disabled={isReadOnly || isProductionMode}
                  {...register(`indent.items.${itemIndex}.processes.${pIndex}.estimatedHours`, {
                    valueAsNumber: true,
                  })}
                  error={
                    errors.indent?.items?.[itemIndex]?.processes?.[pIndex]?.estimatedHours?.message
                  }
                />
              </div>
              {canViewCostSheet && (
                <div className={plannedCol}>
                  <Input
                    label="Planned Cost (₹)"
                    type="number"
                    step="0.01"
                    disabled={isReadOnly || isProductionMode}
                    {...register(`indent.items.${itemIndex}.processes.${pIndex}.predictedCost`, {
                      valueAsNumber: true,
                    })}
                    error={
                      errors.indent?.items?.[itemIndex]?.processes?.[pIndex]?.predictedCost?.message
                    }
                  />
                </div>
              )}
              {canViewCostSheet && showActual && (
                <div className={actualCol}>
                  <Input
                    label="Actual Cost (₹)"
                    type="number"
                    step="0.01"
                    disabled={!isAccountsMode}
                    {...register(`indent.items.${itemIndex}.processes.${pIndex}.actualCost`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              )}
              {!isReadOnly && !isAccountsMode && !isProductionMode && (
                <div className="md:col-span-1 flex justify-end">
                  <Button type="button" variant="danger" size="sm" onClick={() => remove(pIndex)}>
                    Rem
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {canViewCostSheet && (
        <div className="mt-4 flex justify-end border-t border-border-default pt-3">
          <div className="text-right">
            <p className="text-xs text-text-secondary uppercase">
              Total Cost for this Product (Material + Process)
            </p>
            <p className="text-lg font-bold text-accent-primary">
              ₹
              {(itemTotal?.predicted || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            {(isAccountsMode || itemTotal?.actual > 0) && (
              <p className="text-sm font-bold text-status-success mt-1">
                Actual: ₹
                {(itemTotal?.actual || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const IndentForm: React.FC<IndentFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
  forceReadOnly,
  isAccountsMode,
  isProductionMode,
}) => {
  const user = useAuthStore((s) => s.user);
  const canViewCostSheet = !!(
    user?.permissions?.includes('costsheet.view') || user?.permissions?.includes('settings.manage')
  );

  const isReadOnly = React.useMemo(() => {
    if (isProductionMode) return false;
    if (forceReadOnly) return true;
    if (!initialData) {
      const access = getWorkflowAccess('DRAFT', user);
      return !access.canEdit;
    }
    const access = getWorkflowAccess(initialData.currentState as any, user);
    return !access.canEdit;
  }, [initialData, user, forceReadOnly, isProductionMode]);

  const parsedIndentRemarks = parseIndentRemarks(initialData?.remarks);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<IndentFormData>({
    resolver: zodResolver(indentSchema) as never,
    defaultValues: initialData
      ? {
          indent: {
            productName: initialData.productName ?? '',
            departmentName: initialData.departmentName ?? '',
            priority: initialData.priority as Priority,
            requiredDate: initialData.requiredDate.split('T')[0],
            purpose: initialData.purpose || '',
            layoutNumber: parsedIndentRemarks.layoutNumber || '',
            customerName: parsedIndentRemarks.customerName || '',
            remarks: parsedIndentRemarks.userRemarks || '',
            items:
              initialData.items?.map((item, index) => {
                const parsed = parseItemRemarks(item.remarks);
                const itemProcessCosts = parsedIndentRemarks.itemProcessCosts?.[index] || [];

                return {
                  product: parsed.product ?? '',
                  materialName: item.material?.materialName ?? '',
                  size: parsed.size ?? '',
                  weight: parsed.weight ?? '',
                  quantity: Number(item.quantity),
                  unitId: item.unitId,
                  source: parsed.source ?? '',
                  productionSource: parsed.productionSource ?? '',
                  remarks: parsed.userRemarks ?? '',
                  processes:
                    item.indentProcesses?.map((ip: any, pIdx: number) => {
                      const pId = ip.processId || ip.process?.id;
                      const savedCost =
                        itemProcessCosts.find((ipc) => ipc.processId === pId)?.predictedCost || 0;
                      return {
                        processId: pId,
                        processName: ip.process?.processName || '',
                        estimatedHours: Number(ip.estimatedHours || 0),
                        predictedCost: savedCost,
                        actualCost: ip.actualCost ? Number(ip.actualCost) : undefined,
                        actualHours: ip.actualHours ? Number(ip.actualHours) : undefined,
                        vendorType: parsed.processSources?.[pIdx] || '',
                        productionSource: parsed.processProductionSources?.[pIdx] || '',
                      };
                    }) || [],
                };
              }) || [],
          },
          costSheet: {
            predictedTotal: initialData.costSheet?.predictedTotal || 0,
            designCost: parsedIndentRemarks.designCost || 0,
            overheadCost: parsedIndentRemarks.overheadCost || 0,
            contingencyCost: parsedIndentRemarks.contingencyCost || 0,
            actualDesignCost: parsedIndentRemarks.actualDesignCost || 0,
            actualOverheadCost: parsedIndentRemarks.actualOverheadCost || 0,
            actualContingencyCost: parsedIndentRemarks.actualContingencyCost || 0,
            costItems:
              initialData.costSheet?.costItems?.map((ci) => ({
                materialName: ci.material?.materialName ?? '',
                predictedRate: ci.predictedRate,
                predictedQuantity: ci.predictedQuantity,
                predictedAmount: ci.predictedAmount,
                actualRate: ci.actualRate ?? undefined,
                actualAmount: ci.actualAmount ?? undefined,
              })) || [],
          },
        }
      : {
          indent: {
            priority: Priority.MEDIUM,
            purpose: '',
            layoutNumber: '',
            customerName: '',
            remarks: '',
            requiredDate: new Date().toISOString().split('T')[0],
            items: [
              {
                product: '',
                materialName: '',
                size: '',
                quantity: 1,
                unitId: '',
                source: '',
                productionSource: '',
                remarks: '',
                processes: [],
              },
            ],
          },
          costSheet: {
            predictedTotal: 0,
            designCost: 0,
            overheadCost: 0,
            contingencyCost: 0,
            actualDesignCost: 0,
            actualOverheadCost: 0,
            actualContingencyCost: 0,
            costItems: [
              { materialName: '', predictedRate: 0, predictedQuantity: 1, predictedAmount: 0 },
            ],
          },
        },
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: 'indent.items',
  });

  const watchedItems = useWatch({ control, name: 'indent.items' });
  const watchedCostItems = useWatch({ control, name: 'costSheet.costItems' });
  const watchedDesignCost = useWatch({ control, name: 'costSheet.designCost' });
  const watchedOverheadCost = useWatch({ control, name: 'costSheet.overheadCost' });
  const watchedContingencyCost = useWatch({ control, name: 'costSheet.contingencyCost' });
  const watchedActualDesignCost = useWatch({ control, name: 'costSheet.actualDesignCost' });
  const watchedActualOverheadCost = useWatch({ control, name: 'costSheet.actualOverheadCost' });
  const watchedActualContingencyCost = useWatch({ control, name: 'costSheet.actualContingencyCost' });

  // Live API data for the master-data fields below.
  const { data: unitsData } = useUnits({ page: 1, limit: 200 });
  const { data: processesData } = useProcesses({ page: 1, limit: 200 });

  const units = unitsData?.items ?? [];
  const processes = processesData?.items ?? [];

  // Sync items to costItems when materials are added/removed
  useEffect(() => {
    if (!watchedItems) return;

    const newCostItems = watchedItems.map((item, index) => {
      const existingCostItem = watchedCostItems?.[index];
      const rate = existingCostItem?.predictedRate || 0;
      const qty = item.quantity || 0;
      return {
        materialName: item.materialName,
        predictedRate: rate,
        predictedQuantity: qty,
        predictedAmount: rate * qty,
      };
    });

    const needsUpdate =
      newCostItems.length !== (watchedCostItems?.length || 0) ||
      newCostItems.some(
        (nci, i) =>
          nci.materialName !== watchedCostItems?.[i]?.materialName ||
          nci.predictedQuantity !== watchedCostItems?.[i]?.predictedQuantity,
      );

    if (needsUpdate) {
      setValue('costSheet.costItems', newCostItems);
    }
  }, [watchedItems, watchedCostItems, setValue]);

  // Derived Totals
  let totalMaterialCost = 0;
  let totalProcessCost = 0;
  let actualTotalMaterialCost = 0;
  let actualTotalProcessCost = 0;

  const itemTotals = (watchedItems || []).map((item, index) => {
    const matCost = watchedCostItems?.[index]?.predictedAmount || 0;
    const actualMatCost = watchedCostItems?.[index]?.actualAmount || 0;
    const procCost = (item.processes || []).reduce(
      (sum, p) => sum + (Number(p.predictedCost) || 0),
      0,
    );
    const actualProcCost = (item.processes || []).reduce(
      (sum, p) => sum + (Number(p.actualCost) || 0),
      0,
    );
    totalMaterialCost += matCost;
    totalProcessCost += procCost;
    actualTotalMaterialCost += actualMatCost;
    actualTotalProcessCost += actualProcCost;
    return {
      predicted: matCost + procCost,
      actual: actualMatCost + actualProcCost,
    };
  });

  const subTotal = totalMaterialCost + totalProcessCost;
  const grandTotal =
    subTotal +
    (Number(watchedDesignCost) || 0) +
    (Number(watchedOverheadCost) || 0) +
    (Number(watchedContingencyCost) || 0);

  const actualSubTotal = actualTotalMaterialCost + actualTotalProcessCost;
  const actualGrandTotal =
    actualSubTotal +
    (Number(watchedActualDesignCost) || 0) +
    (Number(watchedActualOverheadCost) || 0) +
    (Number(watchedActualContingencyCost) || 0);

  // Calculate Predicted Total
  useEffect(() => {
    setValue('costSheet.predictedTotal', grandTotal);
    setValue('costSheet.actualTotal', actualGrandTotal);
  }, [grandTotal, actualGrandTotal, setValue]);

  const handleFormSubmit = (data: IndentFormData) => {
    const poNumber = data.indent.purpose || '';
    const { layoutNumber, customerName, ...restIndent } = data.indent;

    // Flatten all processes for the backend CostSheet
    const allProcessCosts: any[] = [];

    const formattedItems = data.indent.items.map((item) => {
      const backendProcesses = item.processes?.map((p, idx) => {
        allProcessCosts.push({
          processId: p.processId,
          estimatedHours: p.estimatedHours,
          predictedCost: p.predictedCost,
          actualHours: p.actualHours,
          actualCost: p.actualCost,
        });
        return {
          processId: p.processId,
          sequence: idx + 1,
          estimatedHours: p.estimatedHours,
        };
      });

      return {
        materialName: item.materialName,
        quantity: item.quantity,
        unitId: item.unitId,
        remarks: JSON.stringify({
          product: item.product,
          size: item.size,
          weight: item.weight || '',
          source: item.source,
          productionSource: item.productionSource,
          userRemarks: item.remarks || '',
          processSources: item.processes?.map((p) => p.vendorType || '') || [],
          processProductionSources: item.processes?.map((p) => p.productionSource || '') || [],
        }),
        processes: backendProcesses?.length ? backendProcesses : undefined,
      };
    });

    const itemProcessCostsMap = data.indent.items.map(
      (item) =>
        item.processes?.map((p) => ({
          processId: p.processId,
          predictedCost: p.predictedCost,
        })) || [],
    );

    const formattedData = {
      ...data,
      indent: {
        ...restIndent,
        productName: poNumber ? `PO ${poNumber}` : 'Materials',
        departmentName: user?.department?.departmentName || 'Design',
        remarks: JSON.stringify({
          layoutNumber: layoutNumber || '',
          customerName: customerName || '',
          userRemarks: restIndent.remarks || '',
          designCost: data.costSheet.designCost || 0,
          overheadCost: data.costSheet.overheadCost || 0,
          contingencyCost: data.costSheet.contingencyCost || 0,
          actualDesignCost: data.costSheet.actualDesignCost || 0,
          actualOverheadCost: data.costSheet.actualOverheadCost || 0,
          actualContingencyCost: data.costSheet.actualContingencyCost || 0,
          itemProcessCosts: itemProcessCostsMap,
        }),
        items: formattedItems,
      },
      costSheet: {
        predictedTotal: data.costSheet.predictedTotal,
        costItems: data.costSheet.costItems,
        processCosts: allProcessCosts.length
          ? allProcessCosts
          : [
              {
                processId: '00000000-0000-0000-0000-000000000000',
                predictedCost: 0,
                estimatedHours: 0,
              },
            ], // Fallback to avoid empty array error if validation slips
      },
    };

    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 max-w-5xl">
      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <h3 className="text-sm font-bold text-text-primary mb-4">Basic Information (Indent)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="PO Number"
            placeholder="e.g. PO 756"
            disabled={isReadOnly || isProductionMode}
            {...register('indent.purpose')}
            error={errors.indent?.purpose?.message}
          />
          <Input
            label="Date"
            type="date"
            disabled={isReadOnly || isProductionMode}
            {...register('indent.requiredDate')}
            error={errors.indent?.requiredDate?.message}
          />
          <Controller
            control={control}
            name="indent.priority"
            render={({ field }) => (
              <Select
                label="Priority"
                options={Object.values(Priority).map((p) => ({ label: p, value: p }))}
                error={errors.indent?.priority?.message}
                disabled={isReadOnly || isProductionMode}
                {...field}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t border-border-default/50 pt-4">
          <Input
            label="Layout Number"
            placeholder="e.g. L-1234"
            disabled={isReadOnly || isProductionMode}
            {...register('indent.layoutNumber')}
            error={errors.indent?.layoutNumber?.message}
          />
          <Input
            label="Customer Name"
            placeholder="e.g. Boeing"
            disabled={isReadOnly || isProductionMode}
            {...register('indent.customerName')}
            error={errors.indent?.customerName?.message}
          />
          <Input
            label="Remarks / Comments"
            placeholder="Additional requirements..."
            disabled={isReadOnly || isProductionMode}
            {...register('indent.remarks')}
            error={errors.indent?.remarks?.message}
          />
        </div>
      </div>

      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-text-primary">
            Material & Manufacturing Process Requirements
          </h3>
          {!isReadOnly && !isProductionMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendItem({
                  product: '',
                  materialName: '',
                  size: '',
                  quantity: 1,
                  unitId: '',
                  source: '',
                  productionSource: '',
                  remarks: '',
                  processes: [],
                })
              }
            >
              Add Material
            </Button>
          )}
        </div>

        {errors.indent?.items?.root && (
          <p className="text-xs text-status-error mb-4">{errors.indent.items.root.message}</p>
        )}
        {errors.indent?.items?.message && (
          <p className="text-xs text-status-error mb-4">{(errors.indent.items as any).message}</p>
        )}

        <div className="space-y-4">
          {itemFields.map((field, index) => (
            <div
              key={field.id}
              className="border border-border-default rounded-lg p-4 bg-background-primary space-y-3"
            >
              {/* Row 1: Product, Material, Size, Source, Rem */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-1 text-xs font-bold text-text-muted pb-2">
                  #{index + 1}
                </div>
                <div className={isReadOnly ? 'md:col-span-3' : 'md:col-span-2'}>
                  <Input
                    label="Part Name / Product"
                    placeholder="e.g. Base plate"
                    disabled={isReadOnly || isProductionMode}
                    {...register(`indent.items.${index}.product`)}
                    error={errors.indent?.items?.[index]?.product?.message}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Material"
                    placeholder="e.g. MS"
                    disabled={isReadOnly || isProductionMode}
                    {...register(`indent.items.${index}.materialName`)}
                    error={errors.indent?.items?.[index]?.materialName?.message}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Size"
                    placeholder="e.g. 250*250*25"
                    disabled={isReadOnly || isProductionMode}
                    {...register(`indent.items.${index}.size`)}
                    error={errors.indent?.items?.[index]?.size?.message}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Weight (kgs)"
                    placeholder="e.g. 15.5"
                    disabled={isReadOnly || isProductionMode}
                    {...register(`indent.items.${index}.weight`)}
                    error={errors.indent?.items?.[index]?.weight?.message}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Source"
                    placeholder="e.g. In-house"
                    disabled={isReadOnly || isProductionMode}
                    {...register(`indent.items.${index}.source`)}
                    error={errors.indent?.items?.[index]?.source?.message}
                  />
                </div>
                {!isReadOnly && !isProductionMode && (
                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      Rem
                    </Button>
                  </div>
                )}
              </div>

              {/* Row 2: Qty, Unit, Est. Rate, Amount */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border-t border-border-default/50 pt-3">
                <div className="md:col-span-1" />
                <div className={canViewCostSheet ? 'md:col-span-2' : 'md:col-span-3'}>
                  <Input
                    label="Quantity"
                    type="number"
                    step="0.01"
                    disabled={isReadOnly || isProductionMode}
                    {...register(`indent.items.${index}.quantity`, {
                      valueAsNumber: true,
                      onChange: (e) => {
                        const qty = parseFloat(e.target.value) || 0;
                        const rate = watchedCostItems?.[index]?.predictedRate || 0;
                        setValue(`costSheet.costItems.${index}.predictedAmount`, rate * qty);
                      },
                    })}
                    error={errors.indent?.items?.[index]?.quantity?.message}
                  />
                </div>
                <div className={canViewCostSheet ? 'md:col-span-2' : 'md:col-span-3'}>
                  <Controller
                    control={control}
                    name={`indent.items.${index}.unitId`}
                    render={({ field }) => (
                      <Select
                        label="Unit"
                        disabled={isReadOnly || isProductionMode}
                        options={[
                          { label: 'Select Unit', value: '' },
                          ...units.map((u) => ({
                            label: `${u.symbol || u.unitName}`,
                            value: u.id,
                          })),
                        ]}
                        error={errors.indent?.items?.[index]?.unitId?.message}
                        {...field}
                      />
                    )}
                  />
                </div>
                <div className={canViewCostSheet ? 'md:col-span-3' : 'md:col-span-4'}>
                  <Input
                    label="Prod. Source"
                    placeholder="e.g. Supplier XYZ"
                    disabled={!isProductionMode}
                    {...register(`indent.items.${index}.productionSource`)}
                  />
                </div>
                {canViewCostSheet && (
                  <>
                    <div className={isAccountsMode ? 'md:col-span-2' : 'md:col-span-3'}>
                      <Input
                        label="Est. Rate (₹)"
                        type="number"
                        step="0.01"
                        disabled={isReadOnly && !isProductionMode}
                        {...register(`costSheet.costItems.${index}.predictedRate`, {
                          valueAsNumber: true,
                          onChange: (e) => {
                            const rate = parseFloat(e.target.value) || 0;
                            const qty = watchedItems?.[index]?.quantity || 0;
                            setValue(`costSheet.costItems.${index}.predictedAmount`, rate * qty);
                          },
                        })}
                        error={errors.costSheet?.costItems?.[index]?.predictedRate?.message}
                      />
                    </div>
                    <div className={isAccountsMode ? 'md:col-span-2' : 'md:col-span-3'}>
                      <Input
                        label="Material Cost (₹)"
                        type="number"
                        disabled={true}
                        {...register(`costSheet.costItems.${index}.predictedAmount`)}
                      />
                    </div>
                    {(isAccountsMode || watchedCostItems?.[index]?.actualRate !== undefined) && (
                      <div className="md:col-span-2">
                        <Input
                          label="Actual Rate (₹)"
                          type="number"
                          step="0.01"
                          disabled={!isAccountsMode}
                          {...register(`costSheet.costItems.${index}.actualRate`, {
                            valueAsNumber: true,
                            onChange: (e) => {
                              const rate = parseFloat(e.target.value) || 0;
                              const qty = watchedItems?.[index]?.quantity || 0;
                              setValue(`costSheet.costItems.${index}.actualAmount`, rate * qty);
                            },
                          })}
                        />
                      </div>
                    )}
                    {(isAccountsMode || watchedCostItems?.[index]?.actualAmount !== undefined) && (
                      <div className="md:col-span-2">
                        <Input
                          label="Actual Mat. Cost (₹)"
                          type="number"
                          disabled
                          {...register(`costSheet.costItems.${index}.actualAmount`)}
                        />
                      </div>
                    )}
                  </>
                )}
                <div className="md:col-span-1" />
              </div>

              {/* Nested Process Array for this item */}
              <NestedProcessArray
                control={control}
                register={register}
                itemIndex={index}
                errors={errors}
                isReadOnly={isReadOnly}
                isAccountsMode={isAccountsMode}
                isProductionMode={isProductionMode}
                processesList={processes}
                itemTotal={itemTotals[index]}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Global Cost Form section */}
      {canViewCostSheet && (
        <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
          <h3 className="text-sm font-bold text-text-primary mb-4">
            Global Costs (Design & Overhead)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-background-primary border border-border-default rounded-lg text-center">
              <p className="text-xs text-text-secondary uppercase">Total Material Cost</p>
              <p className="text-xl font-bold text-text-primary">
                ₹
                {totalMaterialCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="p-4 bg-background-primary border border-border-default rounded-lg text-center">
              <p className="text-xs text-text-secondary uppercase">Total Process Cost</p>
              <p className="text-xl font-bold text-text-primary">
                ₹
                {totalProcessCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Design Cost (₹)"
                type="number"
                step="0.01"
                disabled={isReadOnly}
                {...register('costSheet.designCost', { valueAsNumber: true })}
                error={errors.costSheet?.designCost?.message}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Overhead Cost (₹)"
                type="number"
                step="0.01"
                disabled={isReadOnly}
                {...register('costSheet.overheadCost', { valueAsNumber: true })}
                error={errors.costSheet?.overheadCost?.message}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Contingency Cost (₹)"
                type="number"
                step="0.01"
                disabled={isReadOnly}
                {...register('costSheet.contingencyCost', { valueAsNumber: true })}
                error={errors.costSheet?.contingencyCost?.message}
              />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border-default pt-6">
            <div className="text-right md:text-left">
              <p className="text-sm text-text-secondary">Subtotal (Material + Process)</p>
              <p className="text-xl font-bold text-text-primary">
                ₹
                {subTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {(isAccountsMode || actualSubTotal > 0) && (
                <p className="text-sm font-bold text-status-success mt-1">
                  Actual: ₹
                  {actualSubTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">
                Grand Total (Material + Process + Global)
              </p>
              <p className="text-2xl font-bold text-accent-primary">
                ₹
                {grandTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {(isAccountsMode || actualGrandTotal > 0) && (
                <p className="text-lg font-bold text-status-success mt-1">
                  Actual: ₹
                  {actualGrandTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {(!isReadOnly || isAccountsMode || isProductionMode) && (
        <div className="flex justify-end gap-3 pt-6">
          <Button type="submit" loading={isLoading} disabled={isLoading}>
            {isAccountsMode
              ? 'Update Actual Costs'
              : isProductionMode
                ? 'Save Production Details'
                : initialData
                  ? 'Update Transaction'
                  : 'Create Transaction'}
          </Button>
        </div>
      )}
    </form>
  );
};
