export interface AuditLogEntry {
  id: string;
  module: string;
  recordId: string;
  action: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  performedBy: string | null;
  user: {
    firstName: string;
    lastName: string;
    employeeCode: string;
  } | null;
  ipAddress: string | null;
  browser: string | null;
  operatingSystem: string | null;
  device: string | null;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  module?: string;
  action?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
