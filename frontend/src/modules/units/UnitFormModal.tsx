import React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { inputClasses } from '../../components/ui/inputClasses';
import type { CreateUnitPayload, UnitResponse, UpdateUnitPayload } from '../../types/unit';

const requiredString = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} cannot exceed ${max} characters`);

const schema = z.object({
  unitCode: requiredString('Unit code', 20),
  unitName: requiredString('Unit name', 100),
  symbol: requiredString('Symbol', 10),
});

interface UnitFormValues {
  unitCode: string;
  unitName: string;
  symbol: string;
}

interface UnitFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  unit: UnitResponse | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUnitPayload | UpdateUnitPayload) => void;
}

export const UnitFormModal: React.FC<UnitFormModalProps> = ({
  open,
  mode,
  unit,
  loading,
  onClose,
  onSubmit,
}) => {
  const isCreate = mode === 'create';

  const defaultValues: UnitFormValues = unit
    ? {
        unitCode: unit.unitCode,
        unitName: unit.unitName,
        symbol: unit.symbol,
      }
    : {
        unitCode: '',
        unitName: '',
        symbol: '',
      };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UnitFormValues>({
    resolver: zodResolver(schema) as Resolver<UnitFormValues>,
    defaultValues,
  });

  const handleFormSubmit = (values: UnitFormValues) => {
    if (isCreate) {
      const payload: CreateUnitPayload = {
        unitCode: values.unitCode.trim(),
        unitName: values.unitName.trim(),
        symbol: values.symbol.trim(),
      };
      onSubmit(payload);
      return;
    }

    const payload: UpdateUnitPayload = {
      unitCode: values.unitCode.trim(),
      unitName: values.unitName.trim(),
      symbol: values.symbol.trim(),
    };
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isCreate ? 'Create Unit' : 'Edit Unit'}
      description={isCreate ? 'Add a new unit of measure' : `Edit ${unit?.unitName ?? 'unit'}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(handleFormSubmit)} loading={loading}>
            {isCreate ? 'Create Unit' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <FormField
          label="Unit Code"
          htmlFor="unitCode"
          required
          error={errors.unitCode?.message}
          hint="Unique unit code"
        >
          <input
            id="unitCode"
            type="text"
            className={inputClasses}
            placeholder="KG"
            {...register('unitCode')}
          />
        </FormField>

        <FormField label="Unit Name" htmlFor="unitName" required error={errors.unitName?.message}>
          <input
            id="unitName"
            type="text"
            className={inputClasses}
            placeholder="Kilogram"
            {...register('unitName')}
          />
        </FormField>

        <FormField label="Symbol" htmlFor="symbol" required error={errors.symbol?.message}>
          <input
            id="symbol"
            type="text"
            className={inputClasses}
            placeholder="kg"
            {...register('symbol')}
          />
        </FormField>
      </form>
    </Modal>
  );
};
