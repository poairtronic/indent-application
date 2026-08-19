export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'BLACKLISTED';

export type ProcessStatus = 'ACTIVE' | 'INACTIVE';

export type CostSheetStatus = 'DRAFT' | 'FINALIZED' | 'CANCELLED';

export type VendorProcessType = 'IN_HOUSE' | 'OUTSOURCED';

export type IndentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type FileType = 'PDF' | 'DRAWING' | 'CAD' | 'IMAGE' | 'EXCEL' | 'OTHER';

export type WorkflowState =
  | 'DRAFT'
  | 'DESIGN_COMPLETED'
  | 'STORES_PROCESSING'
  | 'MATERIALS_ISSUED'
  | 'PRODUCTION_PROCESSING'
  | 'PRODUCTION_COMPLETED'
  | 'ACCOUNTS_COST_VERIFICATION'
  | 'ACTUAL_COST_UPDATED'
  | 'ACCOUNTS_FINANCIAL_CLOSURE'
  | 'ARCHIVED'
  | 'COMPLETED';

export type WorkflowLoop = 'MANUFACTURING_LOOP' | 'FINANCIAL_LOOP';

export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'MANAGE';

export type NotificationEventType =
  | 'BUSINESS_TRANSACTION_SUBMITTED'
  | 'STORES_MATERIAL_ISSUED'
  | 'PRODUCTION_COMPLETED'
  | 'ACCOUNTS_COST_VERIFIED'
  | 'ACCOUNTS_FINANCIAL_CLOSED'
  | 'TRANSACTION_ARCHIVED'
  | 'TRANSACTION_COMPLETED';

export type AuditEventType =
  | 'CREATE_DRAFT'
  | 'SUBMIT_DESIGN'
  | 'STORES_ISSUE'
  | 'PRODUCTION_UPDATE'
  | 'DELIVER_CUSTOMER'
  | 'VERIFY_COSTS'
  | 'FINANCIAL_CLOSURE'
  | 'ARCHIVE_TRANSACTION';
