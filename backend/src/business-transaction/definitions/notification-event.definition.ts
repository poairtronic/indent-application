import { WorkflowState } from '../enums/workflow-state.enum';
import { CommunicationEventType } from '../../communication/events/communication-event.bus';

export interface NotificationEventRule {
  eventType: CommunicationEventType;
  triggerState: WorkflowState;
  targetDepartmentCode?: string;
  executiveBroadcast: boolean; // Always true for SM & GM in Zero-Approval architecture
  templateTitle: string;
  templateMessage: string;
}

export const NOTIFICATION_EVENT_RULES: Record<WorkflowState, NotificationEventRule | null> = {
  [WorkflowState.DRAFT]: null, // No notification on draft save

  [WorkflowState.DESIGN_COMPLETED]: {
    eventType: CommunicationEventType.DESIGN_COMPLETED,
    triggerState: WorkflowState.DESIGN_COMPLETED,
    targetDepartmentCode: 'STORES',
    executiveBroadcast: true,
    templateTitle: 'New Manufacturing Indent Submitted',
    templateMessage:
      'Design department has submitted Indent #{indentNumber} for product {productName}. Stores processing required.',
  },

  [WorkflowState.STORES_PROCESSING]: {
    eventType: CommunicationEventType.STORES_PENDING,
    triggerState: WorkflowState.STORES_PROCESSING,
    targetDepartmentCode: 'STORES',
    executiveBroadcast: true,
    templateTitle: 'Stores Stock Verification Underway',
    templateMessage: 'Stores stock verification has begun for Indent #{indentNumber}.',
  },

  [WorkflowState.MATERIALS_ISSUED]: {
    eventType: CommunicationEventType.MATERIAL_ISSUED,
    triggerState: WorkflowState.MATERIALS_ISSUED,
    targetDepartmentCode: 'PRODUCTION',
    executiveBroadcast: true,
    templateTitle: 'Stores Material Issued',
    templateMessage:
      'Stores has issued raw materials for Indent #{indentNumber}. Production manufacturing can proceed.',
  },

  [WorkflowState.PRODUCTION_PROCESSING]: {
    eventType: CommunicationEventType.PRODUCTION_STARTED,
    triggerState: WorkflowState.PRODUCTION_PROCESSING,
    targetDepartmentCode: 'PRODUCTION',
    executiveBroadcast: true,
    templateTitle: 'Production Manufacturing Started',
    templateMessage: 'Production manufacturing has started for Indent #{indentNumber}.',
  },

  [WorkflowState.PRODUCTION_COMPLETED]: {
    eventType: CommunicationEventType.PRODUCTION_COMPLETED,
    triggerState: WorkflowState.PRODUCTION_COMPLETED,
    targetDepartmentCode: 'PRODUCTION',
    executiveBroadcast: true,
    templateTitle: 'Production Manufacturing Completed',
    templateMessage:
      'Production department has completed manufacturing for Indent #{indentNumber}. Ready for delivery.',
  },

  [WorkflowState.CUSTOMER_DELIVERED]: {
    eventType: CommunicationEventType.CUSTOMER_DELIVERED,
    triggerState: WorkflowState.CUSTOMER_DELIVERED,
    targetDepartmentCode: 'ACCOUNTS',
    executiveBroadcast: true,
    templateTitle: 'Product Delivered to Customer',
    templateMessage:
      'Finished product for Indent #{indentNumber} delivered to customer. Loop 1 closed. Accounts cost verification required.',
  },

  [WorkflowState.ACCOUNTS_COST_VERIFICATION]: {
    eventType: CommunicationEventType.ACCOUNTS_COST_VERIFICATION,
    triggerState: WorkflowState.ACCOUNTS_COST_VERIFICATION,
    targetDepartmentCode: 'ACCOUNTS',
    executiveBroadcast: true,
    templateTitle: 'Accounts Cost Verification Underway',
    templateMessage:
      'Accounts is verifying actual vendor and in-house costs for Indent #{indentNumber}.',
  },

  [WorkflowState.ACTUAL_COST_UPDATED]: {
    eventType: CommunicationEventType.ACTUAL_COST_UPDATED,
    triggerState: WorkflowState.ACTUAL_COST_UPDATED,
    targetDepartmentCode: 'ACCOUNTS',
    executiveBroadcast: true,
    templateTitle: 'Actual Cost Updated',
    templateMessage: 'Actual costs and variance calculations updated for Indent #{indentNumber}.',
  },

  [WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE]: {
    eventType: CommunicationEventType.FINANCIAL_CLOSURE,
    triggerState: WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE,
    targetDepartmentCode: 'SYSTEM',
    executiveBroadcast: true,
    templateTitle: 'Financial Closure Completed',
    templateMessage:
      'Financial closure and variance calculations completed for Indent #{indentNumber}. Ready for archival.',
  },

  [WorkflowState.ARCHIVED]: {
    eventType: CommunicationEventType.TRANSACTION_ARCHIVED,
    triggerState: WorkflowState.ARCHIVED,
    targetDepartmentCode: 'SYSTEM',
    executiveBroadcast: true,
    templateTitle: 'Business Transaction Archived',
    templateMessage:
      'Transaction documents and history for Indent #{indentNumber} have been archived.',
  },

  [WorkflowState.COMPLETED]: {
    eventType: CommunicationEventType.TRANSACTION_COMPLETED,
    triggerState: WorkflowState.COMPLETED,
    targetDepartmentCode: 'SYSTEM',
    executiveBroadcast: true,
    templateTitle: 'Business Transaction Completed',
    templateMessage:
      'Indent #{indentNumber} has been successfully closed across both Manufacturing and Financial loops.',
  },
};
