import {
  WorkflowState,
  WorkflowLoop,
  CostSheetStatus,
  VendorProcessType,
  IndentPriority,
  FileType,
  NotificationEventType,
  AuditEventType,
} from '../enums/workflow-state.enum';

export interface IIndentProcess {
  id?: string;
  indentItemId?: string;
  processId: string;
  sequence: number;
  estimatedHours: number;
  actualHours?: number;
}

export interface IIndentItem {
  id?: string;
  indentId?: string;
  materialId: string;
  quantity: number;
  unitId: string;
  remarks?: string;
  status?: string;
  processes?: IIndentProcess[];
}

export interface IIndentAttachment {
  id?: string;
  indentId?: string;
  fileName: string;
  fileUrl: string;
  fileType: FileType;
  uploadedBy: string;
}

export interface IIndentSheet {
  id?: string;
  indentNumber?: string;
  productId: string;
  departmentId: string;
  priority: IndentPriority;
  status: WorkflowState;
  requiredDate: Date;
  requiredDeliveryDate?: Date;
  purpose?: string;
  remarks?: string;
  createdBy: string;
  version?: number;
  items: IIndentItem[];
  attachments?: IIndentAttachment[];
}

export interface ICostItem {
  id?: string;
  costSheetId?: string;
  materialId: string;
  vendorId?: string;
  predictedRate: number;
  predictedQuantity: number;
  predictedAmount: number;
  actualRate?: number;
  actualQuantity?: number;
  actualAmount?: number;
  remarks?: string;
}

export interface IProcessCost {
  id?: string;
  costSheetId?: string;
  processId: string;
  predictedCost: number;
  actualCost?: number;
  variance?: number;
  estimatedHours: number;
  actualHours?: number;
  vendorType?: VendorProcessType;
  vendorId?: string;
}

export interface IPlannedCostStructure {
  totalMaterialCost: number;
  totalProcessCost: number;
  predictedTotal: number;
}

export interface IManufacturingProcessStructure {
  processId: string;
  processCode: string;
  processName: string;
  sequence: number;
  estimatedHours: number;
  vendorType: VendorProcessType;
  vendorId?: string;
  plannedCost: number;
}

export interface IProcessCostSheet {
  id?: string;
  costNumber?: string;
  indentId?: string;
  preparedBy: string;
  predictedTotal: number;
  actualTotal?: number;
  varianceAmount?: number;
  variancePercentage?: number;
  status: CostSheetStatus;
  costItems: ICostItem[];
  processCosts: IProcessCost[];
  summary?: IPlannedCostStructure;
}

export interface IBusinessTransaction {
  id?: string;
  indent: IIndentSheet;
  costSheet: IProcessCostSheet;
  currentState: WorkflowState;
  currentLoop: WorkflowLoop;
  isLocked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWorkflowStateTransition {
  fromState: WorkflowState;
  toState: WorkflowState;
  loop: WorkflowLoop;
  actionByDepartment: string;
  performedByUserId: string;
  remarks?: string;
  timestamp: Date;
}

export interface INotificationEvent {
  eventType: NotificationEventType;
  referenceId: string;
  indentNumber: string;
  productName?: string;
  fromState: WorkflowState;
  toState: WorkflowState;
  triggeredByUserId: string;
  targetDepartmentCode?: string;
  executiveBroadcast: boolean;
  message: string;
  timestamp: Date;
}

export interface IAuditEvent {
  eventType: AuditEventType;
  module: string;
  recordId: string;
  performedByUserId: string;
  fromState?: WorkflowState;
  toState?: WorkflowState;
  payload: Record<string, any>;
  ipAddress?: string;
  timestamp: Date;
}

export interface IBusinessValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
