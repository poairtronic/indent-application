import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
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
      };
    }
  } catch {
    // Fallback to legacy
  }
  return { layoutNumber: '', customerName: '', userRemarks: remarks };
}

const indentSchema = z.object({
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
          unitId: z.string().min(1, 'Unit is required'),
          source: z.string().trim().min(1, 'Source is required'),
          remarks: z.string().optional(),
        }),
      )
      .min(1, 'At least one material is required'),
  }),
  costSheet: z.object({
    predictedTotal: z.number(),
    costItems: z.array(
      z.object({
        materialName: z.string(),
        predictedRate: z.number().min(0, 'Rate must be >= 0'),
        predictedQuantity: z.number(),
        predictedAmount: z.number(),
      }),
    ),
    processCosts: z
      .array(
        z.object({
          processId: z.string().min(1, 'Process is required'),
          predictedCost: z.number().min(0, 'Cost must be >= 0'),
          estimatedHours: z.number().min(0, 'Hours must be >= 0'),
        }),
      )
      .min(1, 'At least one process is required'),
  }),
});

type IndentFormData = z.infer<typeof indentSchema>;

interface IndentFormProps {
  initialData?: IndentData;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

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
            layoutNumber: parseIndentRemarks(initialData.remarks).layoutNumber || '',
            customerName: parseIndentRemarks(initialData.remarks).customerName || '',
            remarks: parseIndentRemarks(initialData.remarks).userRemarks || '',
            items: initialData.items?.map((item) => {
              const parsed = parseItemRemarks(item.remarks);
              return {
                product: parsed.product ?? '',
                materialName: item.material?.materialName ?? '',
                size: parsed.size ?? '',
                quantity: Number(item.quantity),
                unitId: item.unitId,
                source: parsed.source ?? '',
                remarks: parsed.userRemarks ?? '',
              };
            }) || [
              {
                product: '',
                materialName: '',
                size: '',
                quantity: 1,
                unitId: '',
                source: '',
                remarks: '',
              },
            ],
          },
          costSheet: {
            predictedTotal: initialData.costSheet?.predictedTotal || 0,
            costItems: initialData.costSheet?.costItems?.map((ci) => ({
              materialName: ci.material?.materialName ?? '',
              predictedRate: ci.predictedRate,
              predictedQuantity: ci.predictedQuantity,
              predictedAmount: ci.predictedAmount,
            })) || [
              { materialName: '', predictedRate: 0, predictedQuantity: 1, predictedAmount: 0 },
            ],
            processCosts: initialData.costSheet?.processCosts?.map((pc) => ({
              processId: pc.processId,
              predictedCost: pc.predictedCost,
              estimatedHours: pc.estimatedHours,
            })) || [{ processId: '', predictedCost: 0, estimatedHours: 0 }],
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
              },
            ],
          },
          costSheet: {
            predictedTotal: 0,
            costItems: [
              { materialName: '', predictedRate: 0, predictedQuantity: 1, predictedAmount: 0 },
            ],
            processCosts: [{ processId: '', predictedCost: 0, estimatedHours: 0 }],
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

  const {
    fields: processFields,
    append: appendProcess,
    remove: removeProcess,
  } = useFieldArray({
    control,
    name: 'costSheet.processCosts',
  });

  const watchedItems = useWatch({ control, name: 'indent.items' });
  const watchedCostItems = useWatch({ control, name: 'costSheet.costItems' });
  const watchedProcesses = useWatch({ control, name: 'costSheet.processCosts' });

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

  // Calculate Predicted Total
  useEffect(() => {
    let total = 0;
    if (watchedCostItems) {
      total += watchedCostItems.reduce((acc, curr) => acc + (curr.predictedAmount || 0), 0);
    }
    if (watchedProcesses) {
      total += watchedProcesses.reduce((acc, curr) => acc + (curr.predictedCost || 0), 0);
    }
    setValue('costSheet.predictedTotal', total);
  }, [watchedCostItems, watchedProcesses, setValue]);

  const handleFormSubmit = (data: IndentFormData) => {
    const poNumber = data.indent.purpose || '';
    const formattedData = {
      ...data,
      indent: {
        ...data.indent,
        productName: poNumber ? `PO ${poNumber}` : 'Materials',
        departmentName: user?.department?.departmentName || 'Design',
        remarks: JSON.stringify({
          layoutNumber: data.indent.layoutNumber || '',
          customerName: data.indent.customerName || '',
          userRemarks: data.indent.remarks || '',
        }),
        items: data.indent.items.map((item) => ({
          materialName: item.materialName,
          quantity: item.quantity,
          unitId: item.unitId,
          remarks: JSON.stringify({
            product: item.product,
            size: item.size,
            source: item.source,
            userRemarks: item.remarks || '',
          }),
        })),
      },
    };
    onSubmit(formattedData);
  };

  const predictedTotal = useWatch({ control, name: 'costSheet.predictedTotal' });

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
            Material Requirements & Planned Material Cost
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
                    label="Amount (₹)"
                    type="number"
                    disabled
                    {...register(`costSheet.costItems.${index}.predictedAmount`)}
                  />
                </div>
                <div className="md:col-span-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-text-primary">
            Planned Manufacturing Process Costs
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendProcess({ processId: '', predictedCost: 0, estimatedHours: 0 })}
            disabled={isReadOnly}
          >
            Add Process
          </Button>
        </div>
        {errors.costSheet?.processCosts && (
          <p className="text-xs text-status-error mb-4">
            {(errors.costSheet.processCosts as any).message ||
              (errors.costSheet.processCosts as any).root?.message}
          </p>
        )}

        <div className="space-y-4">
          {processFields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 border border-border-default rounded-lg bg-background-primary"
            >
              <div className="md:col-span-4">
                <Controller
                  control={control}
                  name={`costSheet.processCosts.${index}.processId`}
                  render={({ field }) => {
                    const selectedProcess = processes.find((p) => p.id === field.value);
                    const inputValue = selectedProcess
                      ? selectedProcess.processName
                      : field.value || '';
                    return (
                      <div className="w-full font-sans">
                        <Input
                          label="Process"
                          placeholder="Type or select a process"
                          value={inputValue}
                          list={`processes-datalist-${index}`}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const val = e.target.value;
                            const matched = processes.find(
                              (p) => p.processName.toLowerCase() === val.toLowerCase(),
                            );
                            field.onChange(matched ? matched.id : val);
                          }}
                          error={
                            errors.costSheet?.processCosts?.[index]?.processId?.message
                              ? 'Please select an existing process from the list'
                              : undefined
                          }
                        />
                        <datalist id={`processes-datalist-${index}`}>
                          {processes.map((p) => (
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
                  {...register(`costSheet.processCosts.${index}.estimatedHours`, {
                    valueAsNumber: true,
                  })}
                  error={errors.costSheet?.processCosts?.[index]?.estimatedHours?.message}
                />
              </div>
              <div className="md:col-span-4">
                <Input
                  label="Predicted Cost (₹)"
                  type="number"
                  step="0.01"
                  disabled={isReadOnly}
                  {...register(`costSheet.processCosts.${index}.predictedCost`, {
                    valueAsNumber: true,
                  })}
                  error={errors.costSheet?.processCosts?.[index]?.predictedCost?.message}
                />
              </div>
              <div className="md:col-span-1 flex justify-end mt-6">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeProcess(index)}
                  disabled={isReadOnly}
                >
                  Rem
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end border-t border-border-default pt-4">
          <div className="text-right">
            <p className="text-sm text-text-secondary">Total Planned Process Cost Sheet</p>
            <p className="text-2xl font-bold text-accent-primary">
              ₹
              {(predictedTotal || 0).toLocaleString(undefined, {
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
