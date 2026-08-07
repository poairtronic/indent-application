import React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { inputClasses } from '../../components/ui/inputClasses';
import type {
  CreateProcessPayload,
  ProcessResponse,
  ProcessStatus,
  UpdateProcessPayload,
} from '../../types/process';
import { useProducts } from '../../api/services/products';

const requiredString = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} cannot exceed ${max} characters`);

const estimatedHoursField = z.coerce
  .number()
  .refine((value) => !Number.isNaN(value), 'Estimated hours is required')
  .min(0.01, 'Estimated hours must be greater than 0')
  .max(999999.99, 'Estimated hours is too large')
  .refine((value) => Math.round(value * 100) / 100 === value, 'Maximum 2 decimal places');

const createSchema = z.object({
  productId: z.uuid('Enter a valid product UUID'),
  processCode: requiredString('Process code', 50),
  processName: requiredString('Process name', 150),
  description: z
    .string()
    .trim()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional()
    .or(z.literal('')),
  sequence: z.coerce
    .number()
    .refine((value) => !Number.isNaN(value), 'Sequence is required')
    .int('Sequence must be a whole number')
    .min(1, 'Sequence must be at least 1'),
  estimatedHours: estimatedHoursField,
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const editSchema = z.object({
  productId: z.uuid('Enter a valid product UUID'),
  processCode: requiredString('Process code', 50),
  processName: requiredString('Process name', 150),
  description: z
    .string()
    .trim()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional()
    .or(z.literal('')),
  sequence: z.coerce
    .number()
    .refine((value) => !Number.isNaN(value), 'Sequence is required')
    .int('Sequence must be a whole number')
    .min(1, 'Sequence must be at least 1'),
  estimatedHours: estimatedHoursField,
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

interface ProcessFormValues {
  productId: string;
  processCode: string;
  processName: string;
  description: string;
  sequence: number;
  estimatedHours: number;
  status: ProcessStatus;
}

interface ProcessFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  process: ProcessResponse | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateProcessPayload | UpdateProcessPayload) => void;
}

export const ProcessFormModal: React.FC<ProcessFormModalProps> = ({
  open,
  mode,
  process,
  loading,
  onClose,
  onSubmit,
}) => {
  const isCreate = mode === 'create';
  const schema = isCreate ? createSchema : editSchema;

  const { data: productsData } = useProducts({ page: 1, limit: 1000 });
  const products = productsData?.items ?? [];

  const defaultValues: ProcessFormValues = process
    ? {
        productId: process.productId,
        processCode: process.processCode,
        processName: process.processName,
        description: process.description ?? '',
        sequence: process.sequence,
        estimatedHours: process.estimatedHours,
        status: process.status,
      }
    : {
        productId: '',
        processCode: '',
        processName: '',
        description: '',
        sequence: 1,
        estimatedHours: 0,
        status: 'ACTIVE',
      };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProcessFormValues>({
    resolver: zodResolver(schema) as Resolver<ProcessFormValues>,
    defaultValues,
  });

  const handleFormSubmit = (values: ProcessFormValues) => {
    if (isCreate) {
      const payload: CreateProcessPayload = {
        productId: values.productId,
        processCode: values.processCode.trim(),
        processName: values.processName.trim(),
        description: values.description.trim() || undefined,
        sequence: values.sequence,
        estimatedHours: values.estimatedHours,
        status: values.status || 'ACTIVE',
      };
      onSubmit(payload);
      return;
    }

    const payload: UpdateProcessPayload = {
      productId: values.productId,
      processCode: values.processCode.trim(),
      processName: values.processName.trim(),
      description: values.description.trim(),
      sequence: values.sequence,
      estimatedHours: values.estimatedHours,
      status: values.status,
    };
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isCreate ? 'Create Manufacturing Process' : 'Edit Manufacturing Process'}
      description={
        isCreate
          ? 'Add a new manufacturing process to a product'
          : `Edit ${process?.processName ?? 'process'}`
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(handleFormSubmit)} loading={loading}>
            {isCreate ? 'Create Process' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <FormField label="Product" htmlFor="productId" required error={errors.productId?.message}>
          <select id="productId" className={inputClasses} {...register('productId')}>
            <option value="">Select a Product</option>
            {products.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.productName} ({prod.productCode})
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Process Code"
          htmlFor="processCode"
          required
          error={errors.processCode?.message}
          hint="Unique within the product"
        >
          <input
            id="processCode"
            type="text"
            className={inputClasses}
            placeholder="MLG-001"
            {...register('processCode')}
          />
        </FormField>

        <FormField
          label="Process Name"
          htmlFor="processName"
          required
          error={errors.processName?.message}
        >
          <input
            id="processName"
            type="text"
            className={inputClasses}
            placeholder="Milling"
            {...register('processName')}
          />
        </FormField>

        <FormField label="Sequence" htmlFor="sequence" required error={errors.sequence?.message}>
          <input
            id="sequence"
            type="number"
            min={1}
            step={1}
            className={inputClasses}
            placeholder="1"
            {...register('sequence', { valueAsNumber: true })}
          />
        </FormField>

        <FormField
          label="Estimated Hours"
          htmlFor="estimatedHours"
          required
          error={errors.estimatedHours?.message}
        >
          <input
            id="estimatedHours"
            type="number"
            min={0.01}
            step={0.01}
            className={inputClasses}
            placeholder="4.5"
            {...register('estimatedHours', { valueAsNumber: true })}
          />
        </FormField>

        <FormField label="Status" htmlFor="status" error={errors.status?.message}>
          <select id="status" className={inputClasses} {...register('status')}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </FormField>

        <div className="sm:col-span-2">
          <FormField label="Description" htmlFor="description" error={errors.description?.message}>
            <textarea
              id="description"
              rows={3}
              className={inputClasses}
              placeholder="CNC milling of body housing"
              {...register('description')}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
};
