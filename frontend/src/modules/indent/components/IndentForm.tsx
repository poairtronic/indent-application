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
  source?: string;
  userRemarks?: string;
}

export function parseItemRemarks(remarks: string | null | undefined): ParsedRemarks {
  if (!remarks) return { product: '', size: '', source: '', userRemarks: '' };
  try {
    const parsed = JSON.parse(remarks);
    if (parsed && typeof parsed === 'object') {
      return {
        product: parsed.product || '',
        size: parsed.size || '',
        source: parsed.source || '',
        userRemarks: parsed.userRemarks || '',
      };
    }
  } catch {
    // Legacy remarks
  }
  return { product: '', size: '', source: '', userRemarks: remarks };
}

export interface ParsedIndentRemarks {
  layoutNumber?: string;
  customerName?: string;
  userRemarks?: string;
  designCost?: number;
  overheadCost?: number;
  contingencyCost?: number;
  itemProcessCosts?: Array<Array<{ processId: string; predictedCost: number }>>;
}

export function parseIndentRemarks(remarks: string | null | undefined): ParsedIndentRemarks {
  if (!remarks) return { layoutNumber: '', customerName: '', userRemarks: '' };
  try {
    const parsed = JSON.parse(remarks);
    if (parsed && typeof parsed === 'object') {
      return {
        layoutNumber: parsed.layoutNumber || '',
        customerName: parsed.customerName || '',
        userRemarks: parsed.userRemarks || '',
        designCost: Number(parsed.designCost) || 0,
        overheadCost: Number(parsed.overheadCost) || 0,
        contingencyCost: Number(parsed.contingencyCost) || 0,
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
            size: z.string().trim().min(1, 'Size is required'),
            quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
            unitId: z.string().uuid('Please select a valid unit'),
            source: z.string().trim().min(1, 'Source is required'),
            remarks: z.string().optional(),
            processes: z
              .array(
                z.object({
                  processId: z.string().uuid('Please select an existing process'),
                  predictedCost: z.number().min(0, 'Cost must be >= 0'),
                  estimatedHours: z.number().min(0, 'Hours must be >= 0'),
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
      costItems: z.array(
        z.object({
          materialName: z.string(),
          predictedRate: z.number().min(0, 'Rate must be >= 0'),
          predictedQuantity: z.number(),
          predictedAmount: z.number(),
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
}

const NestedProcessArray: React.FC<{
  control: Control<IndentFormData>;
  register: any;
  itemIndex: number;
  errors: any;
  isReadOnly: boolean;
  processesList: any[];
  itemTotal: number;
}> = ({ control, register, itemIndex, errors, isReadOnly, processesList, itemTotal }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `indent.items.${itemIndex}.processes`,
  });

  return (
    <div className="mt-4 p-4 bg-surface-base rounded border border-border-default">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-bold text-text-secondary uppercase">Manufacturing Processes</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ processId: '', predictedCost: 0, estimatedHours: 0 })}
          disabled={isReadOnly}
        >
          Add Process
        </Button>
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
        {fields.map((field, pIndex) => (
          <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-5">
              <Controller
                control={control}
                name={`indent.items.${itemIndex}.processes.${pIndex}.processId`}
                render={({ field }) => {
                  const selectedProcess = processesList.find((p) => p.id === field.value);
                  const inputValue = selectedProcess
                    ? selectedProcess.processName
                    : field.value || '';
                  return (
                    <div className="w-full font-sans">
                      <Input
                        label="Process"
                        placeholder="Type or select process"
                        value={inputValue}
                        list={`processes-datalist-${itemIndex}-${pIndex}`}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matched = processesList.find(
                            (p) => p.processName.toLowerCase() === val.toLowerCase(),
                          );
                          field.onChange(matched ? matched.id : val);
                        }}
                        error={
                          errors.indent?.items?.[itemIndex]?.processes?.[pIndex]?.processId?.message
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
            <div className="md:col-span-3">
              <Input
                label="Est. Hours"
                type="number"
                step="0.5"
                disabled={isReadOnly}
                {...register(`indent.items.${itemIndex}.processes.${pIndex}.estimatedHours`, {
                  valueAsNumber: true,
                })}
                error={
                  errors.indent?.items?.[itemIndex]?.processes?.[pIndex]?.estimatedHours?.message
                }
              />
            </div>
            <div className="md:col-span-3">
              <Input
                label="Planned Cost (₹)"
                type="number"
                step="0.01"
                disabled={isReadOnly}
                {...register(`indent.items.${itemIndex}.processes.${pIndex}.predictedCost`, {
                  valueAsNumber: true,
                })}
                error={
                  errors.indent?.items?.[itemIndex]?.processes?.[pIndex]?.predictedCost?.message
                }
              />
            </div>
            <div className="md:col-span-1 flex justify-end">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => remove(pIndex)}
                disabled={isReadOnly}
              >
                Rem
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end border-t border-border-default pt-3">
        <div className="text-right">
          <p className="text-xs text-text-secondary uppercase">
            Total Cost for this Product (Material + Process)
          </p>
          <p className="text-lg font-bold text-accent-primary">
            ₹
            {(itemTotal || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export const IndentForm: React.FC<IndentFormProps> = ({ initialData, onSubmit, isLoading }) => {
  const user = useAuthStore((s) => s.user);

  const isReadOnly = React.useMemo(() => {
    if (!initialData) {
      const access = getWorkflowAccess('DRAFT', user);
      return !access.canEdit;
    }
    const access = getWorkflowAccess(initialData.currentState as any, user);
    return !access.canEdit;
  }, [initialData, user]);

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
                  quantity: Number(item.quantity),
                  unitId: item.unitId,
                  source: parsed.source ?? '',
                  remarks: parsed.userRemarks ?? '',
                  processes:
                    item.indentProcesses?.map((ip: any) => {
                      const pId = ip.processId || ip.process?.id;
                      const savedCost =
                        itemProcessCosts.find((ipc) => ipc.processId === pId)?.predictedCost || 0;
                      return {
                        processId: pId,
                        estimatedHours: Number(ip.estimatedHours || 0),
                        predictedCost: savedCost,
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
            costItems:
              initialData.costSheet?.costItems?.map((ci) => ({
                materialName: ci.material?.materialName ?? '',
                predictedRate: ci.predictedRate,
                predictedQuantity: ci.predictedQuantity,
                predictedAmount: ci.predictedAmount,
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

  const itemTotals = (watchedItems || []).map((item, index) => {
    const matCost = watchedCostItems?.[index]?.predictedAmount || 0;
    const procCost = (item.processes || []).reduce(
      (sum, p) => sum + (Number(p.predictedCost) || 0),
      0,
    );
    totalMaterialCost += matCost;
    totalProcessCost += procCost;
    return matCost + procCost;
  });

  const subTotal = totalMaterialCost + totalProcessCost;
  const grandTotal =
    subTotal +
    (Number(watchedDesignCost) || 0) +
    (Number(watchedOverheadCost) || 0) +
    (Number(watchedContingencyCost) || 0);

  // Calculate Predicted Total
  useEffect(() => {
    setValue('costSheet.predictedTotal', grandTotal);
  }, [grandTotal, setValue]);

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
          source: item.source,
          userRemarks: item.remarks || '',
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
            disabled={isReadOnly}
            {...register('indent.purpose')}
            error={errors.indent?.purpose?.message}
          />
          <Input
            label="Date"
            type="date"
            disabled={isReadOnly}
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
                disabled={isReadOnly}
                {...field}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t border-border-default/50 pt-4">
          <Input
            label="Layout Number"
            placeholder="e.g. L-1234"
            disabled={isReadOnly}
            {...register('indent.layoutNumber')}
            error={errors.indent?.layoutNumber?.message}
          />
          <Input
            label="Customer Name"
            placeholder="e.g. Boeing"
            disabled={isReadOnly}
            {...register('indent.customerName')}
            error={errors.indent?.customerName?.message}
          />
          <Input
            label="Remarks / Comments"
            placeholder="Additional requirements..."
            disabled={isReadOnly}
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
                remarks: '',
                processes: [],
              })
            }
            disabled={isReadOnly}
          >
            Add Material
          </Button>
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
                <div className="md:col-span-3">
                  <Input
                    label="Part Name / Product"
                    placeholder="e.g. Base plate"
                    disabled={isReadOnly}
                    {...register(`indent.items.${index}.product`)}
                    error={errors.indent?.items?.[index]?.product?.message}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Material"
                    placeholder="e.g. MS"
                    disabled={isReadOnly}
                    {...register(`indent.items.${index}.materialName`)}
                    error={errors.indent?.items?.[index]?.materialName?.message}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Size"
                    placeholder="e.g. 250*250*25"
                    disabled={isReadOnly}
                    {...register(`indent.items.${index}.size`)}
                    error={errors.indent?.items?.[index]?.size?.message}
                  />
                </div>
                <div className="md:col-span-3">
                  <Input
                    label="Source"
                    placeholder="e.g. In-house / Supplier"
                    disabled={isReadOnly}
                    {...register(`indent.items.${index}.source`)}
                    error={errors.indent?.items?.[index]?.source?.message}
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={isReadOnly}
                  >
                    Rem
                  </Button>
                </div>
              </div>

              {/* Row 2: Qty, Unit, Est. Rate, Amount */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border-t border-border-default/50 pt-3">
                <div className="md:col-span-1" />
                <div className="md:col-span-2">
                  <Input
                    label="Quantity"
                    type="number"
                    step="0.01"
                    disabled={isReadOnly}
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
                <div className="md:col-span-2">
                  <Controller
                    control={control}
                    name={`indent.items.${index}.unitId`}
                    render={({ field }) => (
                      <Select
                        label="Unit"
                        disabled={isReadOnly}
                        options={units.map((u) => ({
                          label: `${u.symbol || u.unitName}`,
                          value: u.id,
                        }))}
                        error={errors.indent?.items?.[index]?.unitId?.message}
                        {...field}
                      />
                    )}
                  />
                </div>
                <div className="md:col-span-3">
                  <Input
                    label="Est. Rate (₹)"
                    type="number"
                    step="0.01"
                    disabled={isReadOnly}
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
                <div className="md:col-span-3">
                  <Input
                    label="Material Cost (₹)"
                    type="number"
                    disabled
                    {...register(`costSheet.costItems.${index}.predictedAmount`)}
                  />
                </div>
                <div className="md:col-span-1" />
              </div>

              {/* Nested Process Array for this item */}
              <NestedProcessArray
                control={control}
                register={register}
                itemIndex={index}
                errors={errors}
                isReadOnly={isReadOnly}
                processesList={processes}
                itemTotal={itemTotals[index]}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Global Cost Form section */}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Design Cost (₹)"
            type="number"
            step="0.01"
            disabled={isReadOnly}
            {...register('costSheet.designCost', { valueAsNumber: true })}
            error={errors.costSheet?.designCost?.message}
          />
          <Input
            label="Overhead Cost (₹)"
            type="number"
            step="0.01"
            disabled={isReadOnly}
            {...register('costSheet.overheadCost', { valueAsNumber: true })}
            error={errors.costSheet?.overheadCost?.message}
          />
          <Input
            label="Contingency Cost (₹)"
            type="number"
            step="0.01"
            disabled={isReadOnly}
            {...register('costSheet.contingencyCost', { valueAsNumber: true })}
            error={errors.costSheet?.contingencyCost?.message}
          />
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
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary">Grand Total (Material + Process + Global)</p>
            <p className="text-2xl font-bold text-accent-primary">
              ₹
              {grandTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={isLoading} disabled={isLoading || isReadOnly}>
          {initialData ? 'Update Transaction' : 'Create Transaction'}
        </Button>
      </div>
    </form>
  );
};
