import { AuditEventType } from '../enums/workflow-state.enum';

export interface AuditEventDefinition {
  eventType: AuditEventType;
  actionCode: string;
  moduleName: string;
  description: string;
}

export const AUDIT_EVENT_DEFINITIONS: Record<AuditEventType, AuditEventDefinition> = {
  [AuditEventType.CREATE_DRAFT]: {
    eventType: AuditEventType.CREATE_DRAFT,
    actionCode: 'BUSINESS_TRANSACTION_CREATE_DRAFT',
    moduleName: 'BUSINESS_TRANSACTION',
    description: 'Created new Business Transaction draft.',
  },

  [AuditEventType.SUBMIT_DESIGN]: {
    eventType: AuditEventType.SUBMIT_DESIGN,
    actionCode: 'BUSINESS_TRANSACTION_SUBMIT_DESIGN',
    moduleName: 'BUSINESS_TRANSACTION',
    description: 'Design completed and submitted to Stores.',
  },

  [AuditEventType.STORES_ISSUE]: {
    eventType: AuditEventType.STORES_ISSUE,
    actionCode: 'STORES_MATERIAL_ISSUE',
    moduleName: 'STORES',
    description: 'Raw materials verified and issued to Production work center.',
  },

  [AuditEventType.PRODUCTION_UPDATE]: {
    eventType: AuditEventType.PRODUCTION_UPDATE,
    actionCode: 'PRODUCTION_STATUS_UPDATE',
    moduleName: 'PRODUCTION',
    description: 'Updated manufacturing execution status.',
  },

  [AuditEventType.VERIFY_COSTS]: {
    eventType: AuditEventType.VERIFY_COSTS,
    actionCode: 'ACCOUNTS_COST_VERIFICATION',
    moduleName: 'ACCOUNTS',
    description: 'Actual process costs entered and verified against invoices.',
  },

  [AuditEventType.FINANCIAL_CLOSURE]: {
    eventType: AuditEventType.FINANCIAL_CLOSURE,
    actionCode: 'ACCOUNTS_FINANCIAL_CLOSURE',
    moduleName: 'ACCOUNTS',
    description: 'Financial records finalized and variance calculated.',
  },

  [AuditEventType.ARCHIVE_TRANSACTION]: {
    eventType: AuditEventType.ARCHIVE_TRANSACTION,
    actionCode: 'SYSTEM_AUTOMATED_ARCHIVAL',
    moduleName: 'SYSTEM',
    description: 'Business transaction records and history archived.',
  },
};
