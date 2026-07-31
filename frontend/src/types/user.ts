export interface UserRole {
  id: string;
  roleName: string;
}

export interface UserDepartment {
  id: string;
  departmentCode: string;
  departmentName: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  department: UserDepartment;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  permissions: string[];
  isAuthenticated: boolean;
}

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface UserResponse {
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
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsers {
  items: UserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  roleId?: string;
  status?: UserStatus;
}

export interface CreateUserPayload {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  departmentId: string;
  roleId: string;
  status?: UserStatus;
  profileImage?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  departmentId?: string;
  roleId?: string;
  status?: UserStatus;
  profileImage?: string;
}

export interface RoleOption {
  id: string;
  roleName: string;
  description?: string | null;
  isSystem?: boolean;
  userCount?: number;
}

export interface DepartmentOption {
  id: string;
  name: string;
}
