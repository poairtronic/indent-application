import { WorkflowState, WorkflowLoop } from '../enums/workflow-state.enum';

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
}

export const WORKFLOW_STAGE_DEFINITIONS: Record<WorkflowState, StageDefinition> = {
  [WorkflowState.DRAFT]: {
    state: WorkflowState.DRAFT,
    sequence: 1,
    loop: WorkflowLoop.MANUFACTURING_LOOP,
    owningDepartmentCode: 'DESIGN',
    requiredPermissionCode: 'indent.create',
    allowedNextStates: [WorkflowState.DESIGN_COMPLETED],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'Design department drafting Indent Sheet and Process Cost Sheet.',
  },

  [WorkflowState.DESIGN_COMPLETED]: {
    state: WorkflowState.DESIGN_COMPLETED,
    sequence: 2,
    loop: WorkflowLoop.MANUFACTURING_LOOP,
    owningDepartmentCode: 'DESIGN',
    requiredPermissionCode: 'indent.submit',
    allowedNextStates: [WorkflowState.STORES_PROCESSING],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'Design completed and submitted to Stores for material fulfillment.',
  },

  [WorkflowState.STORES_PROCESSING]: {
    state: WorkflowState.STORES_PROCESSING,
    sequence: 3,
    loop: WorkflowLoop.MANUFACTURING_LOOP,
    owningDepartmentCode: 'STORES',
    requiredPermissionCode: 'stores.issue',
    allowedNextStates: [WorkflowState.PRODUCTION_PROCESSING],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'Stores department verifying stock and issuing raw materials to Production.',
  },

  [WorkflowState.PRODUCTION_PROCESSING]: {
    state: WorkflowState.PRODUCTION_PROCESSING,
    sequence: 4,
    loop: WorkflowLoop.MANUFACTURING_LOOP,
    owningDepartmentCode: 'PRODUCTION',
    requiredPermissionCode: 'production.update',
    allowedNextStates: [WorkflowState.CUSTOMER_DELIVERED],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'Production department manufacturing product and updating work center status.',
  },

  [WorkflowState.CUSTOMER_DELIVERED]: {
    state: WorkflowState.CUSTOMER_DELIVERED,
    sequence: 5,
    loop: WorkflowLoop.MANUFACTURING_LOOP,
    owningDepartmentCode: 'PRODUCTION',
    requiredPermissionCode: 'production.deliver',
    allowedNextStates: [WorkflowState.ACCOUNTS_COST_VERIFICATION],
    isLoopBoundary: true, // Closes Loop 1 (Manufacturing)
    isTerminalState: false,
    description: 'Finished product delivered to customer. Loop 1 (Manufacturing) closed.',
  },

  [WorkflowState.ACCOUNTS_COST_VERIFICATION]: {
    state: WorkflowState.ACCOUNTS_COST_VERIFICATION,
    sequence: 6,
    loop: WorkflowLoop.FINANCIAL_LOOP,
    owningDepartmentCode: 'ACCOUNTS',
    requiredPermissionCode: 'accounts.verify',
    allowedNextStates: [WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'Accounts collecting vendor bills, entering actual costs, and computing variance.',
  },

  [WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE]: {
    state: WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE,
    sequence: 7,
    loop: WorkflowLoop.FINANCIAL_LOOP,
    owningDepartmentCode: 'ACCOUNTS',
    requiredPermissionCode: 'accounts.close',
    allowedNextStates: [WorkflowState.ARCHIVED],
    isLoopBoundary: true, // Financial closure completed
    isTerminalState: false,
    description: 'Accounts finalized financial records and closed transaction costing.',
  },

  [WorkflowState.ARCHIVED]: {
    state: WorkflowState.ARCHIVED,
    sequence: 8,
    loop: WorkflowLoop.FINANCIAL_LOOP,
    owningDepartmentCode: 'SYSTEM',
    requiredPermissionCode: 'system.archive',
    allowedNextStates: [WorkflowState.COMPLETED],
    isLoopBoundary: false,
    isTerminalState: false,
    description: 'System automatically archiving transaction history and drawings.',
  },

  [WorkflowState.COMPLETED]: {
    state: WorkflowState.COMPLETED,
    sequence: 9,
    loop: WorkflowLoop.FINANCIAL_LOOP,
    owningDepartmentCode: 'SYSTEM',
    requiredPermissionCode: 'system.complete',
    allowedNextStates: [],
    isLoopBoundary: true, // Closes Loop 2 (Financial) and overall Business Transaction
    isTerminalState: true,
    description: 'Business Transaction fully completed and closed across both loops.',
  },
};
