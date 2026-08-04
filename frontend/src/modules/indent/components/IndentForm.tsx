import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { TextArea } from '../../../components/ui/TextArea';
import { Priority, type Indent } from '../../../types/indent';

const indentSchema = z.object({
  indent: z.object({
    productId: z.string().min(1, 'Product is required'),
    departmentId: z.string().min(1, 'Department is required'),
    priority: z.nativeEnum(Priority),
    requiredDate: z.string().min(1, 'Required date is required'),
    purpose: z.string().optional(),
    remarks: z.string().optional(),
    items: z
      .array(
        z.object({
          materialId: z.string().min(1, 'Material is required'),
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
        materialId: z.string(),
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
  initialData?: Indent;
  onSubmit: (data: any) => void;
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
    resolver: zodResolver(indentSchema) as any,
    defaultValues: initialData
      ? {
          indent: {
            productId: initialData.productId,
            departmentId: initialData.departmentId,
            priority: initialData.priority,
            requiredDate: initialData.requiredDate.split('T')[0],
            purpose: initialData.purpose || '',
            remarks: initialData.remarks || '',
            items: initialData.indentItems?.map((item) => ({
              materialId: item.materialId,
              quantity: Number(item.quantity),
              unitId: item.unitId,
              remarks: item.remarks || '',
            })) || [{ materialId: '', quantity: 1, unitId: '', remarks: '' }],
          },
          costSheet: {
            predictedTotal: initialData.costSheet?.predictedTotal || 0,
            costItems: initialData.costSheet?.costItems?.map((ci) => ({
              materialId: ci.materialId,
              predictedRate: ci.predictedRate,
              predictedQuantity: ci.predictedQuantity,
              predictedAmount: ci.predictedAmount,
            })) || [{ materialId: '', predictedRate: 0, predictedQuantity: 1, predictedAmount: 0 }],
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
            items: [{ materialId: '', quantity: 1, unitId: '', remarks: '' }],
          },
          costSheet: {
            predictedTotal: 0,
            costItems: [
              { materialId: '', predictedRate: 0, predictedQuantity: 1, predictedAmount: 0 },
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

  // Watch for material changes to sync with costItems
  const watchedItems = useWatch({ control, name: 'indent.items' });
  const watchedCostItems = useWatch({ control, name: 'costSheet.costItems' });
  const watchedProcesses = useWatch({ control, name: 'costSheet.processCosts' });

  // Sync items to costItems when materials are added/removed
  useEffect(() => {
    if (!watchedItems) return;

    const newCostItems = watchedItems.map((item, index) => {
      const existingCostItem = watchedCostItems?.[index];
      const rate = existingCostItem?.predictedRate || 0;
      const qty = item.quantity || 0;
      return {
        materialId: item.materialId,
        predictedRate: rate,
        predictedQuantity: qty,
        predictedAmount: rate * qty,
      };
    });

    // Prevent infinite loop by checking if we really need to update
    const needsUpdate =
      newCostItems.length !== (watchedCostItems?.length || 0) ||
      newCostItems.some(
        (nci, i) =>
          nci.materialId !== watchedCostItems?.[i]?.materialId ||
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

  // Mock data for dropdowns (in real app, use queries)
  const products = [
    { id: '1', name: 'Product A' },
    { id: '2', name: 'Product B' },
  ];
  const departments = [
    { id: '1', name: 'Design Dept' },
    { id: '2', name: 'Stores Dept' },
  ];
  const materials = [
    { id: '1', name: 'Steel' },
    { id: '2', name: 'Aluminum' },
  ];
  const units = [
    { id: '1', name: 'kg' },
    { id: '2', name: 'pcs' },
  ];
  const processes = [
    { id: '1', name: 'Turning' },
    { id: '2', name: 'Milling' },
    { id: '3', name: 'Heat Treatment' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl">
      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <h3 className="text-sm font-bold text-text-primary mb-4">Basic Information (Indent)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            control={control}
            name="indent.productId"
            render={({ field }) => (
              <Select
                label="Product"
                options={products.map((p) => ({ label: p.name, value: p.id }))}
                error={errors.indent?.productId?.message}
                {...field}
              />
            )}
          />
          <Controller
            control={control}
            name="indent.departmentId"
            render={({ field }) => (
              <Select
                label="Department"
                options={departments.map((d) => ({ label: d.name, value: d.id }))}
                error={errors.indent?.departmentId?.message}
                {...field}
              />
            )}
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
            onClick={() => appendItem({ materialId: '', quantity: 1, unitId: '', remarks: '' })}
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
                <Controller
                  control={control}
                  name={`indent.items.${index}.materialId`}
                  render={({ field }) => (
                    <Select
                      label="Material"
                      options={materials.map((m) => ({ label: m.name, value: m.id }))}
                      error={errors.indent?.items?.[index]?.materialId?.message}
                      {...field}
                    />
                  )}
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
                      options={units.map((u) => ({ label: u.name, value: u.id }))}
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
                      options={processes.map((p) => ({ label: p.name, value: p.id }))}
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
