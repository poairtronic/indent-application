import type { AuthUser } from '../api/services/auth/types';

// ──────────────────────────────────────────────────────────────
// DEPARTMENT / ROLE → ALLOWED EVENT TYPES (eventType-based)
// Mirrors the server-side DEPT_EVENT_MAP for local fallback.
// Server-side filtering is authoritative (D2).
// ──────────────────────────────────────────────────────────────
const DEPT_EVENT_MAP: Record<string, string[]> = {
  DESIGN: ['ACTUAL_COST_UPDATED', 'DOCUMENT_UPLOADED', 'DOCUMENT_DELETED', 'DOCUMENT_REPLACED'],
  DSGN: ['ACTUAL_COST_UPDATED', 'DOCUMENT_UPLOADED', 'DOCUMENT_DELETED', 'DOCUMENT_REPLACED'],
  STORES: ['DESIGN_COMPLETED', 'STORES_PENDING'],
  STOR: ['DESIGN_COMPLETED', 'STORES_PENDING'],
  PRODUCTION: ['MATERIAL_ISSUED', 'PRODUCTION_STARTED', 'PRODUCTION_COMPLETED'],
  PROD: ['MATERIAL_ISSUED', 'PRODUCTION_STARTED', 'PRODUCTION_COMPLETED'],
  ACCOUNTS: [
    'PRODUCTION_COMPLETED',
    'CUSTOMER_DELIVERED',
    'ACCOUNTS_COST_VERIFICATION',
    'ACTUAL_COST_UPDATED',
    'FINANCIAL_CLOSURE',
    'DOCUMENT_UPLOADED',
  ],
  ACCT: [
    'PRODUCTION_COMPLETED',
    'CUSTOMER_DELIVERED',
    'ACCOUNTS_COST_VERIFICATION',
    'ACTUAL_COST_UPDATED',
    'FINANCIAL_CLOSURE',
    'DOCUMENT_UPLOADED',
  ],
};

const MANAGER_EVENT_TYPES = [
  'INDENT_SUBMITTED',
  'DESIGN_COMPLETED',
  'STORES_PENDING',
  'MATERIAL_ISSUED',
  'PRODUCTION_STARTED',
  'PRODUCTION_COMPLETED',
  'CUSTOMER_DELIVERED',
  'ACCOUNTS_COST_VERIFICATION',
  'ACTUAL_COST_UPDATED',
  'FINANCIAL_CLOSURE',
  'TRANSACTION_ARCHIVED',
  'TRANSACTION_COMPLETED',
  'DOCUMENT_UPLOADED',
  'DOCUMENT_DELETED',
  'DOCUMENT_REPLACED',
];

export function filterNotificationsForUser(items: any[], user: AuthUser | null): any[] {
  if (!user) return [];

  const roleName = user.role?.roleName;
  const isAdmin = roleName === 'ADMIN' || roleName === 'System Administrator';
  if (isAdmin) return items;

  // Senior Manager / General Manager
  if (roleName === 'Senior Manager' || roleName === 'General Manager') {
    return items.filter((item) => {
      if (item.eventType) return MANAGER_EVENT_TYPES.includes(item.eventType);
      // Legacy fallback for notifications without eventType (pre-D1 records)
      return true;
    });
  }

  const userDept = user.department?.departmentCode?.toUpperCase() ?? '';
  const allowed = DEPT_EVENT_MAP[userDept];
  if (!allowed) return [];

  return items.filter((item) => {
    if (item.eventType) return allowed.includes(item.eventType);
    // Legacy fallback for notifications without eventType (pre-D1 records)
    return true;
  });
}
