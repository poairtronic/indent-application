import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { TextArea } from '../../../components/ui/TextArea';
import { Priority, type Indent } from '../../../types/indent';

const indentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  departmentId: z.string().min(1, 'Department is required'),
  priority: z.nativeEnum(Priority),
  requiredDate: z.string().min(1, 'Required date is required'),
  purpose: z.string().optional(),
  remarks: z.string().optional(),
  indentItems: z
    .array(
      z.object({
        materialId: z.string().min(1, 'Material is required'),
        quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
        unitId: z.string().min(1, 'Unit is required'),
        remarks: z.string().optional(),
      }),
    )
    .min(1, 'At least one material is required'),
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
    formState: { errors },
  } = useForm<IndentFormData>({
    resolver: zodResolver(indentSchema) as any,
    defaultValues: initialData
      ? {
          productId: initialData.productId,
          departmentId: initialData.departmentId,
          priority: initialData.priority,
          requiredDate: initialData.requiredDate.split('T')[0],
          purpose: initialData.purpose || '',
          remarks: initialData.remarks || '',
          indentItems: initialData.indentItems?.map((item) => ({
            materialId: item.materialId,
            quantity: Number(item.quantity),
            unitId: item.unitId,
            remarks: item.remarks || '',
          })) || [{ materialId: '', quantity: 1, unitId: '', remarks: '' }],
        }
      : {
          priority: Priority.MEDIUM,
          indentItems: [{ materialId: '', quantity: 1, unitId: '', remarks: '' }],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'indentItems',
  });

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <h3 className="text-sm font-bold text-text-primary mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            control={control}
            name="productId"
            render={({ field }) => (
              <Select
                label="Product"
                options={products.map((p) => ({ label: p.name, value: p.id }))}
                error={errors.productId?.message}
                {...field}
              />
            )}
          />
          <Controller
            control={control}
            name="departmentId"
            render={({ field }) => (
              <Select
                label="Department"
                options={departments.map((d) => ({ label: d.name, value: d.id }))}
                error={errors.departmentId?.message}
                {...field}
              />
            )}
          />
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select
                label="Priority"
                options={Object.values(Priority).map((p) => ({ label: p, value: p }))}
                error={errors.priority?.message}
                {...field}
              />
            )}
          />
          <Input
            label="Required Date"
            type="date"
            {...register('requiredDate')}
            error={errors.requiredDate?.message}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <TextArea label="Purpose" {...register('purpose')} error={errors.purpose?.message} />
          <TextArea label="Remarks" {...register('remarks')} error={errors.remarks?.message} />
        </div>
      </div>

      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-text-primary">Material Requirements</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ materialId: '', quantity: 1, unitId: '', remarks: '' })}
          >
            Add Material
          </Button>
        </div>

        {errors.indentItems?.root && (
          <p className="text-xs text-status-error mb-4">{errors.indentItems.root.message}</p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 border border-border-default rounded-lg bg-background-primary"
            >
              <div className="md:col-span-4">
                <Controller
                  control={control}
                  name={`indentItems.${index}.materialId`}
                  render={({ field }) => (
                    <Select
                      label="Material"
                      options={materials.map((m) => ({ label: m.name, value: m.id }))}
                      error={errors.indentItems?.[index]?.materialId?.message}
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
                  {...register(`indentItems.${index}.quantity`, { valueAsNumber: true })}
                  error={errors.indentItems?.[index]?.quantity?.message}
                />
              </div>
              <div className="md:col-span-2">
                <Controller
                  control={control}
                  name={`indentItems.${index}.unitId`}
                  render={({ field }) => (
                    <Select
                      label="Unit"
                      options={units.map((u) => ({ label: u.name, value: u.id }))}
                      error={errors.indentItems?.[index]?.unitId?.message}
                      {...field}
                    />
                  )}
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Remarks"
                  {...register(`indentItems.${index}.remarks`)}
                  error={errors.indentItems?.[index]?.remarks?.message}
                />
              </div>
              <div className="md:col-span-1 flex justify-end mt-6">
                <Button type="button" variant="danger" size="sm" onClick={() => remove(index)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={isLoading} disabled={isLoading}>
          {initialData ? 'Update Indent' : 'Create Indent'}
        </Button>
      </div>
    </form>
  );
};
