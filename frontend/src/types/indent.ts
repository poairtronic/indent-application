export enum IndentStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  DESIGN_COMPLETED = 'DESIGN_COMPLETED',
  STORES_PROCESSING = 'STORES_PROCESSING',
  PRODUCTION_PROCESSING = 'PRODUCTION_PROCESSING',
  CUSTOMER_DELIVERED = 'CUSTOMER_DELIVERED',
  ACCOUNTS_COST_VERIFICATION = 'ACCOUNTS_COST_VERIFICATION',
  ACCOUNTS_FINANCIAL_CLOSURE = 'ACCOUNTS_FINANCIAL_CLOSURE',
  ARCHIVED = 'ARCHIVED',
  COMPLETED = 'COMPLETED',
  // Backward compatibility with DB enum if needed
  PENDING_STORES = 'PENDING_STORES',
  PENDING_ACCOUNTS = 'PENDING_ACCOUNTS',
  PENDING_SENIOR_MANAGER = 'PENDING_SENIOR_MANAGER',
  PENDING_GENERAL_MANAGER = 'PENDING_GENERAL_MANAGER',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_PRODUCTION = 'IN_PRODUCTION',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface IndentItem {
  id: string;
  indentId: string;
  materialId: string;
  quantity: number;
  unitId: string;
  remarks?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  // Included relations (populated via API)
  material?: any; // You can type this to Material if available
  unit?: any; // You can type this to Unit if available
}

export interface IndentAttachment {
  id: string;
  indentId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface WorkflowHistory {
  id: string;
  indentId: string;
  fromStage: string;
  toStage: string;
  actionBy: string;
  remarks?: string;
  createdAt: string;
  // Included relations
  actor?: any; // User type
}

export interface Indent {
  id: string;
  indentNumber: string;
  productId: string;
  departmentId: string;
  priority: Priority;
  status: IndentStatus;
  currentStageId?: string;
  requiredDate: string;
  requiredDeliveryDate?: string;
  purpose?: string;
  remarks?: string;
  version: number;
  isLocked: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  indentItems?: IndentItem[];
  attachments?: IndentAttachment[];
  workflowHistory?: WorkflowHistory[];

  // Related entities fetched via joins
  product?: any;
  department?: any;
  creator?: any;
}
