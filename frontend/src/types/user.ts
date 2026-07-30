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
