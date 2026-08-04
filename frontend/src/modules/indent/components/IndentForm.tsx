import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { TextArea } from '../../../components/ui/TextArea';
import { Priority } from '../../../types/indent';
import { useUnits } from '../../../api/services/units/hooks';
import { useProcesses } from '../../../api/services/processes/hooks';
import type { IndentData } from '../../../api/services/indents/service';

const indentSchema = z.object({
  indent: z.object({
    productName: z.string().trim().min(1, 'Product is required'),
    departmentName: z.string().trim().min(1, 'Department is required'),
    priority: z.nativeEnum(Priority),
    requiredDate: z.string().min(1, 'Required date is required'),
    purpose: z.string().optional(),
    remarks: z.string().optional(),
    items: z
      .array(
        z.object({
          materialName: z.string().trim().min(1, 'Material is required'),
          quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
          unitId: z.string().min(1, 'Unit is required'),
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
    processCosts: z.array(
      z.object({
        processId: z.string().min(1, 'Process is required'),
        predictedCost: z.number().min(0, 'Cost must be >= 0'),
        estimatedHours: z.number().min(0, 'Hours must be >= 0'),
      }),
    ),
  }),
});

type IndentFormData = z.infer<typeof indentSchema>;

interface IndentFormProps {
  initialData?: IndentData;
  onSubmit: (data: IndentFormData) => void;
  isLoading?: boolean;
}

export const IndentForm: React.FC<IndentFormProps> = ({ initialData, onSubmit, isLoading }) => {
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
            remarks: initialData.remarks || '',
            items: initialData.items?.map((item) => ({
              materialName: item.material?.materialName ?? '',
              quantity: Number(item.quantity),
              unitId: item.unitId,
              remarks: item.remarks || '',
            })) || [{ materialName: '', quantity: 1, unitId: '', remarks: '' }],
          },
          costSheet: {
            predictedTotal: initialData.costSheet?.predictedTotal || 0,
            costItems: initialData.costSheet?.costItems?.map((ci) => ({
              materialName: ci.material?.materialName ?? '',
              predictedRate: ci.predictedRate,
              predictedQuantity: ci.predictedQuantity,
              predictedAmount: ci.predictedAmount,
            })) || [{ materialName: '', predictedRate: 0, predictedQuantity: 1, predictedAmount: 0 }],
            processCosts:
              initialData.costSheet?.processCosts?.map((pc) => ({
                processId: pc.processId,
                predictedCost: pc.predictedCost,
                estimatedHours: pc.estimatedHours,
              })) || [],
          },
        }
      : {
          indent: {
            priority: Priority.MEDIUM,
            items: [{ materialName: '', quantity: 1, unitId: '', remarks: '' }],
          },
          costSheet: {
            predictedTotal: 0,
            costItems: [
              { materialName: '', predictedRate: 0, predictedQuantity: 1, predictedAmount: 0 },
            ],
            processCosts: [],
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

  const predictedTotal = useWatch({ control, name: 'costSheet.predictedTotal' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl">
      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <h3 className="text-sm font-bold text-text-primary mb-4">Basic Information (Indent)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Product"
            placeholder="Type a product name"
            {...register('indent.productName')}
            error={errors.indent?.productName?.message}
          />
          <Input
            label="Department"
            placeholder="Type a department name"
            {...register('indent.departmentName')}
            error={errors.indent?.departmentName?.message}
          />
          <Controller
            control={control}
            name="indent.priority"
            render={({ field }) => (
              <Select
                label="Priority"
                options={Object.values(Priority).map((p) => ({ label: p, value: p }))}
                error={errors.indent?.priority?.message}
                {...field}
              />
            )}
          />
          <Input
            label="Required Date"
            type="date"
            {...register('indent.requiredDate')}
            error={errors.indent?.requiredDate?.message}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <TextArea
            label="Purpose"
            {...register('indent.purpose')}
            error={errors.indent?.purpose?.message}
          />
          <TextArea
            label="Remarks"
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
            onClick={() => appendItem({ materialName: '', quantity: 1, unitId: '', remarks: '' })}
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
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 border border-border-default rounded-lg bg-background-primary"
            >
              <div className="md:col-span-3">
                <Input
                  label="Material"
                  placeholder="Type a material name"
                  {...register(`indent.items.${index}.materialName`)}
                  error={errors.indent?.items?.[index]?.materialName?.message}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Quantity"
                  type="number"
                  step="0.01"
                  {...register(`indent.items.${index}.quantity`, { valueAsNumber: true })}
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
              <div className="md:col-span-2">
                <Input
                  label="Est. Rate (₹)"
                  type="number"
                  step="0.01"
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
              <div className="md:col-span-2">
                <Input
                  label="Amount (₹)"
                  type="number"
                  disabled
                  {...register(`costSheet.costItems.${index}.predictedAmount`)}
                />
              </div>
              <div className="md:col-span-1 flex justify-end mt-6">
                <Button type="button" variant="danger" size="sm" onClick={() => removeItem(index)}>
                  Rem
                </Button>
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
          >
            Add Process
          </Button>
        </div>

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
                  render={({ field }) => (
                    <Select
                      label="Process"
                      options={processes.map((p) => ({
                        label: p.processName,
                        value: p.id,
                      }))}
                      error={errors.costSheet?.processCosts?.[index]?.processId?.message}
                      {...field}
                    />
                  )}
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Est. Hours"
                  type="number"
                  step="0.5"
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
        <Button type="submit" loading={isLoading} disabled={isLoading}>
          {initialData ? 'Update Transaction' : 'Create Transaction'}
        </Button>
      </div>
    </form>
  );
};
