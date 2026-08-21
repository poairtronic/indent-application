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

const requiredString = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} cannot exceed ${max} characters`);

const processSchema = z.object({
  processName: requiredString('Process name', 150),
  description: z
    .string()
    .trim()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional()
    .or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

interface ProcessFormValues {
  processName: string;
  description: string;
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

  const defaultValues: ProcessFormValues = process
    ? {
        processName: process.processName,
        description: process.description ?? '',
        status: process.status,
      }
    : {
        processName: '',
        description: '',
        status: 'ACTIVE',
      };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProcessFormValues>({
    resolver: zodResolver(processSchema) as Resolver<ProcessFormValues>,
    defaultValues,
  });

  const handleFormSubmit = (values: ProcessFormValues) => {
    if (isCreate) {
      const payload: CreateProcessPayload = {
        processName: values.processName.trim(),
        description: values.description.trim() || undefined,
        status: values.status || 'ACTIVE',
      };
      onSubmit(payload);
      return;
    }

    const payload: UpdateProcessPayload = {
      processName: values.processName.trim(),
      description: values.description.trim(),
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
          ? 'Add a new manufacturing process to the master catalogue'
          : `Edit ${process?.processName ?? 'process'}`
      }
      size="md"
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
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
            placeholder="e.g. Turning, Milling, Grinding, Welding..."
            {...register('processName')}
          />
        </FormField>

        <FormField label="Status" htmlFor="status" error={errors.status?.message}>
          <select id="status" className={inputClasses} {...register('status')}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </FormField>

        <FormField label="Description" htmlFor="description" error={errors.description?.message}>
          <textarea
            id="description"
            rows={3}
            className={inputClasses}
            placeholder="Process overview, machinery specifications, or operating notes..."
            {...register('description')}
          />
        </FormField>
      </form>
    </Modal>
  );
};
