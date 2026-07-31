import { UserStatus } from '@prisma/client';

export interface IUserSanitized {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  departmentId: string;
  departmentName?: string;
  roleId: string;
  roleName?: string;
  status: UserStatus;
  profileImage?: string | null;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  roleId?: string;
  status?: UserStatus;
}
