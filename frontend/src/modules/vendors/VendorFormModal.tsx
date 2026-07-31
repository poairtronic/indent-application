import React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { inputClasses } from '../../components/ui/inputClasses';
import type {
  CreateVendorPayload,
  UpdateVendorPayload,
  VendorResponse,
  VendorStatus,
} from '../../types/vendor';

const requiredString = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} cannot exceed ${max} characters`);

const optionalString = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} cannot exceed ${max} characters`)
    .optional()
    .or(z.literal(''));

const GST_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]\d[Z][0-9A-Z]$/;
const PAN_PATTERN = /^[A-Z]{5}\d{4}[A-Z]$/;
const PINCODE_PATTERN = /^[0-9A-Za-z-]+$/;

const gstField = z
  .string()
  .trim()
  .max(15, 'GST number cannot exceed 15 characters')
  .regex(GST_PATTERN, 'Enter a valid 15-character GST number')
  .or(z.literal(''));

const panField = z
  .string()
  .trim()
  .max(10, 'PAN number cannot exceed 10 characters')
  .regex(PAN_PATTERN, 'Enter a valid 10-character PAN number')
  .or(z.literal(''));

const schema = z.object({
  vendorCode: requiredString('Vendor code', 50),
  vendorName: requiredString('Vendor name', 150),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .max(150, 'Email cannot exceed 150 characters'),
  phone: optionalString('Phone', 20),
  gstNumber: gstField,
  panNumber: panField,
  address: requiredString('Address', 500),
  city: requiredString('City', 100),
  state: requiredString('State', 100),
  country: requiredString('Country', 100),
  pincode: requiredString('Pincode', 10).regex(PINCODE_PATTERN, 'Enter a valid pincode'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'BLACKLISTED']).optional(),
});

interface VendorFormValues {
  vendorCode: string;
  vendorName: string;
  email: string;
  phone: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  status: VendorStatus;
}

interface VendorFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  vendor: VendorResponse | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateVendorPayload | UpdateVendorPayload) => void;
}

export const VendorFormModal: React.FC<VendorFormModalProps> = ({
  open,
  mode,
  vendor,
  loading,
  onClose,
  onSubmit,
}) => {
  const isCreate = mode === 'create';

  const defaultValues: VendorFormValues = vendor
    ? {
        vendorCode: vendor.vendorCode,
        vendorName: vendor.vendorName,
        email: vendor.email,
        phone: vendor.phone ?? '',
        gstNumber: vendor.gstNumber ?? '',
        panNumber: vendor.panNumber ?? '',
        address: vendor.address,
        city: vendor.city,
        state: vendor.state,
        country: vendor.country,
        pincode: vendor.pincode,
        status: vendor.status,
      }
    : {
        vendorCode: '',
        vendorName: '',
        email: '',
        phone: '',
        gstNumber: '',
        panNumber: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        status: 'ACTIVE',
      };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(schema) as Resolver<VendorFormValues>,
    defaultValues,
  });

  const handleFormSubmit = (values: VendorFormValues) => {
    const base = {
      vendorCode: values.vendorCode.trim(),
      vendorName: values.vendorName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim() || undefined,
      gstNumber: values.gstNumber.trim().toUpperCase() || undefined,
      panNumber: values.panNumber.trim().toUpperCase() || undefined,
      address: values.address.trim(),
      city: values.city.trim(),
      state: values.state.trim(),
      country: values.country.trim(),
      pincode: values.pincode.trim(),
    };

    if (isCreate) {
      const payload: CreateVendorPayload = { ...base, status: values.status || 'ACTIVE' };
      onSubmit(payload);
      return;
    }

    const payload: UpdateVendorPayload = { ...base, status: values.status };
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isCreate ? 'Create Vendor' : 'Edit Vendor'}
      description={
        isCreate ? 'Add a new vendor to the master list' : `Edit ${vendor?.vendorName ?? 'vendor'}`
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(handleFormSubmit)} loading={loading}>
            {isCreate ? 'Create Vendor' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <FormField
          label="Vendor Code"
          htmlFor="vendorCode"
          required
          error={errors.vendorCode?.message}
          hint="Unique vendor code"
        >
          <input
            id="vendorCode"
            type="text"
            className={inputClasses}
            placeholder="VND-0001"
            {...register('vendorCode')}
          />
        </FormField>

        <FormField
          label="Vendor Name"
          htmlFor="vendorName"
          required
          error={errors.vendorName?.message}
        >
          <input
            id="vendorName"
            type="text"
            className={inputClasses}
            placeholder="Acme Steels Pvt Ltd"
            {...register('vendorName')}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
          <input
            id="email"
            type="email"
            className={inputClasses}
            placeholder="contact@acmesteels.com"
            {...register('email')}
          />
        </FormField>

        <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
          <input
            id="phone"
            type="tel"
            className={inputClasses}
            placeholder="+91 98765 43210"
            {...register('phone')}
          />
        </FormField>

        <FormField label="GST Number" htmlFor="gstNumber" error={errors.gstNumber?.message}>
          <input
            id="gstNumber"
            type="text"
            className={inputClasses}
            placeholder="27AABCU9603R1ZM"
            {...register('gstNumber')}
          />
        </FormField>

        <FormField label="PAN Number" htmlFor="panNumber" error={errors.panNumber?.message}>
          <input
            id="panNumber"
            type="text"
            className={inputClasses}
            placeholder="AABCU9603R"
            {...register('panNumber')}
          />
        </FormField>

        <div className="sm:col-span-2">
          <FormField label="Address" htmlFor="address" required error={errors.address?.message}>
            <input
              id="address"
              type="text"
              className={inputClasses}
              placeholder="42, Industrial Estate, Hosur Road"
              {...register('address')}
            />
          </FormField>
        </div>

        <FormField label="City" htmlFor="city" required error={errors.city?.message}>
          <input
            id="city"
            type="text"
            className={inputClasses}
            placeholder="Bengaluru"
            {...register('city')}
          />
        </FormField>

        <FormField label="State" htmlFor="state" required error={errors.state?.message}>
          <input
            id="state"
            type="text"
            className={inputClasses}
            placeholder="Karnataka"
            {...register('state')}
          />
        </FormField>

        <FormField label="Country" htmlFor="country" required error={errors.country?.message}>
          <input
            id="country"
            type="text"
            className={inputClasses}
            placeholder="India"
            {...register('country')}
          />
        </FormField>

        <FormField label="Pincode" htmlFor="pincode" required error={errors.pincode?.message}>
          <input
            id="pincode"
            type="text"
            className={inputClasses}
            placeholder="560001"
            {...register('pincode')}
          />
        </FormField>

        <FormField label="Status" htmlFor="status" error={errors.status?.message}>
          <select id="status" className={inputClasses} {...register('status')}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="BLACKLISTED">Blacklisted</option>
          </select>
        </FormField>
      </form>
    </Modal>
  );
};
