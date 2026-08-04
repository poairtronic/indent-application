import React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { inputClasses } from '../../components/ui/inputClasses';
import type {
  CreateUserPayload,
  DepartmentOption,
  RoleOption,
  UpdateUserPayload,
  UserResponse,
  UserStatus,
} from '../../types/user';

const requiredString = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} cannot exceed ${max} characters`);

const emailField = z
  .string()
  .trim()
  .email('Enter a valid email address')
  .max(150, 'Email cannot exceed 150 characters');

const phoneField = z
  .string()
  .trim()
  .max(20, 'Phone cannot exceed 20 characters')
  .optional()
  .or(z.literal(''));

const profileImageField = z
  .string()
  .trim()
  .max(255, 'Profile image URL cannot exceed 255 characters')
  .url('Enter a valid URL')
  .or(z.literal(''));

const statusField = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);

const createSchema = z.object({
  employeeCode: requiredString('Employee code', 50),
  firstName: requiredString('First name', 100),
  lastName: requiredString('Last name', 100),
  email: emailField,
  phone: phoneField,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  departmentId: z.uuid('Select a valid department'),
  roleId: z.uuid('Select a valid role'),
  status: statusField.optional(),
  profileImage: profileImageField,
});

const editSchema = z.object({
  firstName: requiredString('First name', 100),
  lastName: requiredString('Last name', 100),
  email: emailField,
  phone: phoneField,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  departmentId: z.uuid('Select a valid department'),
  roleId: z.uuid('Select a valid role'),
  status: statusField,
  profileImage: profileImageField,
});

interface UserFormValues {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  departmentId: string;
  roleId: string;
  status: UserStatus;
  profileImage: string;
}

interface UserFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  user: UserResponse | null;
  departments: DepartmentOption[];
  roles: RoleOption[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  mode,
  user,
  departments,
  roles,
  loading,
  onClose,
  onSubmit,
}) => {
  const isCreate = mode === 'create';
  const schema = isCreate ? createSchema : editSchema;

  const defaultValues: UserFormValues = user
    ? {
        employeeCode: user.employeeCode,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone ?? '',
        password: '',
        departmentId: user.departmentId,
        roleId: user.roleId,
        status: user.status,
        profileImage: user.profileImage ?? '',
      }
    : {
        employeeCode: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        departmentId: '',
        roleId: '',
        status: 'ACTIVE',
        profileImage: '',
      };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema) as Resolver<UserFormValues>,
    defaultValues,
  });

  const handleFormSubmit = (values: UserFormValues) => {
    if (isCreate) {
      const payload: CreateUserPayload = {
        employeeCode: values.employeeCode.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone || undefined,
        password: values.password,
        departmentId: values.departmentId,
        roleId: values.roleId,
        status: values.status || 'ACTIVE',
        profileImage: values.profileImage || undefined,
      };
      onSubmit(payload);
      return;
    }

    const payload: UpdateUserPayload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone || undefined,
      departmentId: values.departmentId,
      roleId: values.roleId,
      status: values.status,
    };

    if (values.password) payload.password = values.password;
    if (values.profileImage) payload.profileImage = values.profileImage;

    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isCreate ? 'Create User' : `Edit ${user ? `${user.firstName} ${user.lastName}` : 'User'}`
      }
      description={isCreate ? 'Create a new user account' : 'Update user details'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(handleFormSubmit)} loading={loading}>
            {isCreate ? 'Create User' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <FormField
          label="Employee Code"
          htmlFor="employeeCode"
          required
          error={errors.employeeCode?.message}
        >
          <input
            id="employeeCode"
            type="text"
            className={inputClasses}
            placeholder="EMP-1001"
            disabled={!isCreate}
            {...register('employeeCode')}
          />
        </FormField>

        <FormField label="Email Address" htmlFor="email" required error={errors.email?.message}>
          <input
            id="email"
            type="email"
            className={inputClasses}
            placeholder="name@company.com"
            {...register('email')}
          />
        </FormField>

        <FormField
          label="First Name"
          htmlFor="firstName"
          required
          error={errors.firstName?.message}
        >
          <input
            id="firstName"
            type="text"
            className={inputClasses}
            placeholder="John"
            {...register('firstName')}
          />
        </FormField>

        <FormField label="Last Name" htmlFor="lastName" required error={errors.lastName?.message}>
          <input
            id="lastName"
            type="text"
            className={inputClasses}
            placeholder="Doe"
            {...register('lastName')}
          />
        </FormField>

        <FormField
          label="Department"
          htmlFor="departmentId"
          required
          error={errors.departmentId?.message}
        >
          <select id="departmentId" className={inputClasses} {...register('departmentId')}>
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.departmentName}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Role" htmlFor="roleId" required error={errors.roleId?.message}>
          <select id="roleId" className={inputClasses} {...register('roleId')}>
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.roleName}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
          <input
            id="phone"
            type="tel"
            className={inputClasses}
            placeholder="+1234567890"
            {...register('phone')}
          />
        </FormField>

        <FormField label="Status" htmlFor="status" error={errors.status?.message}>
          <select id="status" className={inputClasses} {...register('status')}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </FormField>

        <FormField
          label={isCreate ? 'Password' : 'Reset Password'}
          htmlFor="password"
          required={isCreate}
          error={errors.password?.message}
          hint={isCreate ? 'Minimum 8 characters' : 'Leave blank to keep the current password'}
        >
          <input
            id="password"
            type="password"
            className={inputClasses}
            placeholder="••••••••"
            {...register('password')}
          />
        </FormField>

        <FormField
          label="Profile Image URL"
          htmlFor="profileImage"
          error={errors.profileImage?.message}
          hint="Optional profile image URL"
        >
          <input
            id="profileImage"
            type="url"
            className={inputClasses}
            placeholder="https://cdn.example.com/avatar.jpg"
            {...register('profileImage')}
          />
        </FormField>
      </form>
    </Modal>
  );
};
