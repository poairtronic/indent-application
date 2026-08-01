import { WorkflowState, NotificationEventType } from '../enums/workflow-state.enum';

export interface NotificationEventRule {
  eventType: NotificationEventType;
  triggerState: WorkflowState;
  targetDepartmentCode?: string;
  executiveBroadcast: boolean; // Always true for SM & GM in Zero-Approval architecture
  templateTitle: string;
  templateMessage: string;
}

export const NOTIFICATION_EVENT_RULES: Record<WorkflowState, NotificationEventRule | null> = {
  [WorkflowState.DRAFT]: null, // No notification on draft save

  [WorkflowState.DESIGN_COMPLETED]: {
    eventType: NotificationEventType.BUSINESS_TRANSACTION_SUBMITTED,
    triggerState: WorkflowState.DESIGN_COMPLETED,
    targetDepartmentCode: 'STORES',
    executiveBroadcast: true,
    templateTitle: 'New Manufacturing Indent Submitted',
    templateMessage:
      'Design department has submitted Indent #{indentNumber} for product {productName}. Stores processing required.',
  },

  [WorkflowState.STORES_PROCESSING]: {
    eventType: NotificationEventType.STORES_MATERIAL_ISSUED,
    triggerState: WorkflowState.STORES_PROCESSING,
    targetDepartmentCode: 'PRODUCTION',
    executiveBroadcast: true,
    templateTitle: 'Stores Material Issued',
    templateMessage:
      'Stores has issued raw materials for Indent #{indentNumber}. Production manufacturing can proceed.',
  },

  [WorkflowState.PRODUCTION_PROCESSING]: {
    eventType: NotificationEventType.PRODUCTION_COMPLETED,
    triggerState: WorkflowState.PRODUCTION_PROCESSING,
    targetDepartmentCode: 'PRODUCTION',
    executiveBroadcast: true,
    templateTitle: 'Production Work Center Updated',
    templateMessage: 'Manufacturing process is underway for Indent #{indentNumber}.',
  },

  [WorkflowState.CUSTOMER_DELIVERED]: {
    eventType: NotificationEventType.CUSTOMER_DELIVERED,
    triggerState: WorkflowState.CUSTOMER_DELIVERED,
    targetDepartmentCode: 'ACCOUNTS',
    executiveBroadcast: true,
    templateTitle: 'Product Delivered to Customer',
    templateMessage:
      'Finished product for Indent #{indentNumber} delivered to customer. Loop 1 closed. Accounts cost verification required.',
  },

  [WorkflowState.ACCOUNTS_COST_VERIFICATION]: {
    eventType: NotificationEventType.ACCOUNTS_COST_VERIFIED,
    triggerState: WorkflowState.ACCOUNTS_COST_VERIFICATION,
    targetDepartmentCode: 'ACCOUNTS',
    executiveBroadcast: true,
    templateTitle: 'Accounts Cost Verification Underway',
    templateMessage:
      'Accounts is verifying actual vendor and in-house costs for Indent #{indentNumber}.',
  },

  [WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE]: {
    eventType: NotificationEventType.ACCOUNTS_FINANCIAL_CLOSED,
    triggerState: WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE,
    targetDepartmentCode: 'SYSTEM',
    executiveBroadcast: true,
    templateTitle: 'Financial Closure Completed',
    templateMessage:
      'Financial closure and variance calculations completed for Indent #{indentNumber}. Ready for archival.',
  },

  [WorkflowState.ARCHIVED]: {
    eventType: NotificationEventType.TRANSACTION_ARCHIVED,
    triggerState: WorkflowState.ARCHIVED,
    targetDepartmentCode: 'SYSTEM',
    executiveBroadcast: true,
    templateTitle: 'Business Transaction Archived',
    templateMessage:
      'Transaction documents and history for Indent #{indentNumber} have been archived.',
  },

  [WorkflowState.COMPLETED]: {
    eventType: NotificationEventType.TRANSACTION_COMPLETED,
    triggerState: WorkflowState.COMPLETED,
    targetDepartmentCode: 'SYSTEM',
    executiveBroadcast: true,
    templateTitle: 'Business Transaction Completed',
    templateMessage:
      'Indent #{indentNumber} has been successfully closed across both Manufacturing and Financial loops.',
  },
};
