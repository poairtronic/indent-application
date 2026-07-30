export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    department: {
      id: string;
      departmentCode: string;
      departmentName: string;
    };
    role: {
      id: string;
      roleName: string;
    };
    permissions: string[];
  };
}
