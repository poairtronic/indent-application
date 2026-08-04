/**
 * Frontend Workflow State Machine Definition
 * Mirrors backend WORKFLOW_STAGE_DEFINITIONS for zero-approval two-loop architecture.
 * DO NOT modify workflow states or transitions - they are defined by the backend.
 */

export type WorkflowState =
  | 'DRAFT'
  | 'DESIGN_COMPLETED'
  | 'STORES_PROCESSING'
  | 'MATERIALS_ISSUED'
  | 'PRODUCTION_PROCESSING'
  | 'PRODUCTION_COMPLETED'
  | 'CUSTOMER_DELIVERED'
  | 'ACCOUNTS_COST_VERIFICATION'
  | 'ACTUAL_COST_UPDATED'
  | 'ACCOUNTS_FINANCIAL_CLOSURE'
  | 'ARCHIVED'
  | 'COMPLETED';

export type WorkflowLoop = 'MANUFACTURING_LOOP' | 'FINANCIAL_LOOP';

export interface StageDefinition {
  state: WorkflowState;
  sequence: number;
  loop: WorkflowLoop;
  owningDepartmentCode: string;
  requiredPermissionCode: string;
  allowedNextStates: WorkflowState[];
  isLoopBoundary: boolean;
  isTerminalState: boolean;
  description: string;
  label: string;
  shortLabel: string;
}

export const WORKFLOW_STAGES: Record<WorkflowState, StageDefinition> = {
  DRAFT: {
    state: 'DRAFT',
    sequence: 1,
    loop: 'MANUFACTURING_LOOP',
    owningDepartmentCode: 'DESIGN',
    requiredPermissionCode: 'indent.create',
    allowedNextStates: ['DESIGN_COMPLETED'],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'Design department drafting Indent Sheet and Process Cost Sheet.',
    label: 'Draft',
    shortLabel: 'Draft',
  },
  DESIGN_COMPLETED: {
    state: 'DESIGN_COMPLETED',
    sequence: 2,
    loop: 'MANUFACTURING_LOOP',
    owningDepartmentCode: 'DESIGN',
    requiredPermissionCode: 'indent.submit',
    allowedNextStates: ['STORES_PROCESSING'],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'Design completed and submitted to Stores for material fulfillment.',
    label: 'Design Completed',
    shortLabel: 'Design',
  },
  STORES_PROCESSING: {
    state: 'STORES_PROCESSING',
    sequence: 3,
    loop: 'MANUFACTURING_LOOP',
    owningDepartmentCode: 'STORES',
    requiredPermissionCode: 'stores.issue',
    allowedNextStates: ['MATERIALS_ISSUED'],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'Stores department verifying stock and preparing raw materials issue.',
    label: 'Stores Processing',
    shortLabel: 'Stores',
  },
  MATERIALS_ISSUED: {
    state: 'MATERIALS_ISSUED',
    sequence: 4,
    loop: 'MANUFACTURING_LOOP',
    owningDepartmentCode: 'STORES',
    requiredPermissionCode: 'stores.issue',
    allowedNextStates: ['PRODUCTION_PROCESSING'],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'Stores issued raw materials and dispatched to Production.',
    label: 'Materials Issued',
    shortLabel: 'Materials',
  },
  PRODUCTION_PROCESSING: {
    state: 'PRODUCTION_PROCESSING',
    sequence: 5,
    loop: 'MANUFACTURING_LOOP',
    owningDepartmentCode: 'PRODUCTION',
    requiredPermissionCode: 'production.update',
    allowedNextStates: ['PRODUCTION_COMPLETED'],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'Production department manufacturing product and updating work center status.',
    label: 'Production Processing',
    shortLabel: 'Production',
  },
  PRODUCTION_COMPLETED: {
    state: 'PRODUCTION_COMPLETED',
    sequence: 6,
    loop: 'MANUFACTURING_LOOP',
    owningDepartmentCode: 'PRODUCTION',
    requiredPermissionCode: 'production.update',
    allowedNextStates: ['CUSTOMER_DELIVERED'],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'Manufacturing completed and ready for customer delivery.',
    label: 'Production Completed',
    shortLabel: 'Prod. Done',
  },
  CUSTOMER_DELIVERED: {
    state: 'CUSTOMER_DELIVERED',
    sequence: 7,
    loop: 'MANUFACTURING_LOOP',
    owningDepartmentCode: 'PRODUCTION',
    requiredPermissionCode: 'production.deliver',
    allowedNextStates: ['ACCOUNTS_COST_VERIFICATION'],
    isLoopBoundary: true,
    isTerminalState: false,
    description: 'Finished product delivered to customer. Loop 1 (Manufacturing) closed.',
    label: 'Customer Delivered',
    shortLabel: 'Delivered',
  },
  ACCOUNTS_COST_VERIFICATION: {
    state: 'ACCOUNTS_COST_VERIFICATION',
    sequence: 8,
    loop: 'FINANCIAL_LOOP',
    owningDepartmentCode: 'ACCOUNTS',
    requiredPermissionCode: 'accounts.verify',
    allowedNextStates: ['ACTUAL_COST_UPDATED'],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'Accounts collecting vendor bills, entering actual costs, and computing variance.',
    label: 'Accounts Cost Verification',
    shortLabel: 'Cost Verify',
  },
  ACTUAL_COST_UPDATED: {
    state: 'ACTUAL_COST_UPDATED',
    sequence: 9,
    loop: 'FINANCIAL_LOOP',
    owningDepartmentCode: 'ACCOUNTS',
    requiredPermissionCode: 'accounts.verify',
    allowedNextStates: ['ACCOUNTS_FINANCIAL_CLOSURE'],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'Actual costs entered and variance calculations updated.',
    label: 'Actual Cost Updated',
    shortLabel: 'Costs Updated',
  },
  ACCOUNTS_FINANCIAL_CLOSURE: {
    state: 'ACCOUNTS_FINANCIAL_CLOSURE',
    sequence: 10,
    loop: 'FINANCIAL_LOOP',
    owningDepartmentCode: 'ACCOUNTS',
    requiredPermissionCode: 'accounts.close',
    allowedNextStates: ['ARCHIVED'],
    isLoopBoundary: true,
    isTerminalState: false,
    description: 'Accounts finalized financial records and closed transaction costing.',
    label: 'Financial Closure',
    shortLabel: 'Closed',
  },
  ARCHIVED: {
    state: 'ARCHIVED',
    sequence: 11,
    loop: 'FINANCIAL_LOOP',
    owningDepartmentCode: 'SYSTEM',
    requiredPermissionCode: 'system.archive',
    allowedNextStates: ['COMPLETED'],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'System automatically archiving transaction history and drawings.',
    label: 'Archived',
    shortLabel: 'Archived',
  },
  COMPLETED: {
    state: 'COMPLETED',
    sequence: 12,
    loop: 'FINANCIAL_LOOP',
    owningDepartmentCode: 'SYSTEM',
    requiredPermissionCode: 'system.complete',
    allowedNextStates: [],
    isLoopBoundary: true,
    isTerminalState: true,
    description: 'Business Transaction fully completed and closed across both loops.',
    label: 'Completed',
    shortLabel: 'Done',
  },
};

export const ALL_WORKFLOW_STATES: WorkflowState[] = Object.keys(WORKFLOW_STAGES) as WorkflowState[];

export const MANUFACTURING_LOOP_STATES: WorkflowState[] = ALL_WORKFLOW_STATES.filter(
  (s) => WORKFLOW_STAGES[s].loop === 'MANUFACTURING_LOOP',
);

export const FINANCIAL_LOOP_STATES: WorkflowState[] = ALL_WORKFLOW_STATES.filter(
  (s) => WORKFLOW_STAGES[s].loop === 'FINANCIAL_LOOP',
);

export function getWorkflowStage(state: WorkflowState): StageDefinition {
  return WORKFLOW_STAGES[state];
}

export function getNextStates(currentState: WorkflowState): WorkflowState[] {
  return WORKFLOW_STAGES[currentState]?.allowedNextStates ?? [];
}

export function getWorkflowProgress(currentState: WorkflowState): {
  currentSequence: number;
  totalSteps: number;
  percentage: number;
  loop: WorkflowLoop;
  isLoopBoundary: boolean;
} {
  const stage = WORKFLOW_STAGES[currentState];
  const totalSteps = ALL_WORKFLOW_STATES.length;
  return {
    currentSequence: stage.sequence,
    totalSteps,
    percentage: Math.round((stage.sequence / totalSteps) * 100),
    loop: stage.loop,
    isLoopBoundary: stage.isLoopBoundary,
  };
}

export function formatWorkflowState(state: WorkflowState): string {
  return WORKFLOW_STAGES[state]?.label ?? state.replace(/_/g, ' ');
}

export function getWorkflowStateTone(
  state: WorkflowState,
): 'green' | 'yellow' | 'red' | 'blue' | 'gray' {
  const toneMap: Record<WorkflowState, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
    DRAFT: 'gray',
    DESIGN_COMPLETED: 'blue',
    STORES_PROCESSING: 'yellow',
    MATERIALS_ISSUED: 'yellow',
    PRODUCTION_PROCESSING: 'yellow',
    PRODUCTION_COMPLETED: 'yellow',
    CUSTOMER_DELIVERED: 'blue',
    ACCOUNTS_COST_VERIFICATION: 'yellow',
    ACTUAL_COST_UPDATED: 'yellow',
    ACCOUNTS_FINANCIAL_CLOSURE: 'blue',
    ARCHIVED: 'gray',
    COMPLETED: 'green',
  };
  return toneMap[state] ?? 'gray';
}
