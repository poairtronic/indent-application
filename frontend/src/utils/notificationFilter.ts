import type { AuthUser } from '../api/services/auth/types';

// ──────────────────────────────────────────────────────────────
// DEPARTMENT / ROLE → ALLOWED EVENT TYPES (eventType-based)
// Mirrors the server-side DEPT_EVENT_MAP for local fallback.
// Server-side filtering is authoritative (D2).
// ──────────────────────────────────────────────────────────────
const DEPT_EVENT_MAP: Record<string, string[]> = {
  DESIGN: [
    'INDENT_SUBMITTED',
    'DESIGN_COMPLETED',
    'ACTUAL_COST_UPDATED',
    'DOCUMENT_UPLOADED',
    'DOCUMENT_DELETED',
    'DOCUMENT_REPLACED',
  ],
  DSGN: [
    'INDENT_SUBMITTED',
    'DESIGN_COMPLETED',
    'ACTUAL_COST_UPDATED',
    'DOCUMENT_UPLOADED',
    'DOCUMENT_DELETED',
    'DOCUMENT_REPLACED',
  ],
  STORES: ['DESIGN_COMPLETED', 'STORES_PENDING', 'MATERIAL_ISSUED', 'DOCUMENT_UPLOADED'],
  STOR: ['DESIGN_COMPLETED', 'STORES_PENDING', 'MATERIAL_ISSUED', 'DOCUMENT_UPLOADED'],
  STRS: ['DESIGN_COMPLETED', 'STORES_PENDING', 'MATERIAL_ISSUED', 'DOCUMENT_UPLOADED'],
  PRODUCTION: [
    'MATERIAL_ISSUED',
    'PRODUCTION_STARTED',
    'PRODUCTION_COMPLETED',
    'DOCUMENT_UPLOADED',
  ],
  PROD: ['MATERIAL_ISSUED', 'PRODUCTION_STARTED', 'PRODUCTION_COMPLETED', 'DOCUMENT_UPLOADED'],
  ACCOUNTS: [
    'PRODUCTION_COMPLETED',
    'ACCOUNTS_COST_VERIFICATION',
    'ACTUAL_COST_UPDATED',
    'FINANCIAL_CLOSURE',
    'DOCUMENT_UPLOADED',
  ],
  ACCT: [
    'PRODUCTION_COMPLETED',
    'ACCOUNTS_COST_VERIFICATION',
    'ACTUAL_COST_UPDATED',
    'FINANCIAL_CLOSURE',
    'DOCUMENT_UPLOADED',
  ],
  PURCHASE: ['STORES_PENDING', 'MATERIAL_ISSUED', 'DOCUMENT_UPLOADED'],
  PURC: ['STORES_PENDING', 'MATERIAL_ISSUED', 'DOCUMENT_UPLOADED'],
  QUALITY: ['PRODUCTION_COMPLETED', 'DOCUMENT_UPLOADED'],
  QC: ['PRODUCTION_COMPLETED', 'DOCUMENT_UPLOADED'],
};

const MANAGER_EVENT_TYPES = [
  'INDENT_SUBMITTED',
  'DESIGN_COMPLETED',
  'STORES_PENDING',
  'MATERIAL_ISSUED',
  'PRODUCTION_STARTED',
  'PRODUCTION_COMPLETED',
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
  if (!user || !Array.isArray(items)) return [];

  const roleName = user.role?.roleName?.toUpperCase() || '';
  const deptCode = user.department?.departmentCode?.toUpperCase() || '';

  const isAdmin =
    roleName === 'ADMIN' ||
    roleName === 'SYSTEM ADMINISTRATOR' ||
    deptCode === 'ADMIN' ||
    deptCode === 'ADMINISTRATION' ||
    deptCode === 'ADM' ||
    Boolean(
      user.permissions?.includes('settings.manage') ||
      user.permissions?.includes('notifications.manage'),
    );

  if (isAdmin) return items;

  // Senior Manager / General Manager / Management
  if (
    roleName === 'SENIOR MANAGER' ||
    roleName === 'GENERAL MANAGER' ||
    roleName === 'MANAGEMENT' ||
    deptCode === 'SMGR' ||
    deptCode === 'GMGR' ||
    deptCode === 'MGMT'
  ) {
    return items.filter((item) => {
      if (item.eventType) return MANAGER_EVENT_TYPES.includes(item.eventType);
      return true;
    });
  }

  const allowed = DEPT_EVENT_MAP[deptCode];
  if (!allowed) {
    // If no explicit mapping, return server-delivered items
    return items;
  }

  return items.filter((item) => {
    if (item.eventType) return allowed.includes(item.eventType);
    return true;
  });
}
