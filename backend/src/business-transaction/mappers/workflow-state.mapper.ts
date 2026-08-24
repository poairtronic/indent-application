import { IndentStatus } from '@prisma/client';
import { WorkflowState } from '../enums/workflow-state.enum';

/**
 * Mapper bridging Two-Loop WorkflowState domain enum to Prisma IndentStatus persistence enum.
 * Guarantees 100% compatibility with Phase 1-8C immutable database schema.
 */
export class WorkflowStateMapper {
  private static readonly DOMAIN_TO_PRISMA_MAP: Record<WorkflowState, IndentStatus> = {
    [WorkflowState.DRAFT]: IndentStatus.DRAFT,
    [WorkflowState.DESIGN_COMPLETED]: IndentStatus.SUBMITTED,
    [WorkflowState.STORES_PROCESSING]: IndentStatus.PENDING_STORES,
    [WorkflowState.MATERIALS_ISSUED]: IndentStatus.PENDING_STORES,
    [WorkflowState.PRODUCTION_PROCESSING]: IndentStatus.IN_PRODUCTION,
    [WorkflowState.PRODUCTION_COMPLETED]: IndentStatus.IN_PRODUCTION,
    [WorkflowState.ACCOUNTS_COST_VERIFICATION]: IndentStatus.PENDING_ACCOUNTS,
    [WorkflowState.ACTUAL_COST_UPDATED]: IndentStatus.PENDING_ACCOUNTS,
    [WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE]: IndentStatus.PENDING_SENIOR_MANAGER,
    [WorkflowState.ARCHIVED]: IndentStatus.PENDING_GENERAL_MANAGER,
    [WorkflowState.COMPLETED]: IndentStatus.COMPLETED,
  };

  private static readonly PRISMA_TO_DOMAIN_MAP: Record<IndentStatus, WorkflowState> = {
    [IndentStatus.DRAFT]: WorkflowState.DRAFT,
    [IndentStatus.SUBMITTED]: WorkflowState.DESIGN_COMPLETED,
    [IndentStatus.PENDING_STORES]: WorkflowState.STORES_PROCESSING,
    [IndentStatus.IN_PRODUCTION]: WorkflowState.PRODUCTION_PROCESSING,
    [IndentStatus.APPROVED]: WorkflowState.PRODUCTION_COMPLETED,
    [IndentStatus.PENDING_ACCOUNTS]: WorkflowState.ACCOUNTS_COST_VERIFICATION,
    [IndentStatus.PENDING_SENIOR_MANAGER]: WorkflowState.ACCOUNTS_FINANCIAL_CLOSURE,
    [IndentStatus.PENDING_GENERAL_MANAGER]: WorkflowState.ARCHIVED,
    [IndentStatus.COMPLETED]: WorkflowState.COMPLETED,
    [IndentStatus.REJECTED]: WorkflowState.DRAFT,
    [IndentStatus.CANCELLED]: WorkflowState.DRAFT,
  };

  public static toPrisma(state: WorkflowState): IndentStatus {
    return this.DOMAIN_TO_PRISMA_MAP[state] || IndentStatus.DRAFT;
  }

  public static toDomain(status: IndentStatus, indent?: any): WorkflowState {
    // currentState is the authoritative workflow column. The legacy status
    // projection collapses multiple financial/manufacturing states and must
    // never overwrite a populated domain state.
    if (indent?.currentState && Object.values(WorkflowState).includes(indent.currentState)) {
      return indent.currentState as WorkflowState;
    }
    if (
      status === IndentStatus.PENDING_STORES &&
      indent &&
      indent.remarks &&
      indent.remarks.includes('[MATERIALS_ISSUED]')
    ) {
      return WorkflowState.MATERIALS_ISSUED;
    }
    if (
      status === IndentStatus.IN_PRODUCTION &&
      indent &&
      indent.remarks &&
      indent.remarks.includes('[PRODUCTION_COMPLETED]')
    ) {
      return WorkflowState.PRODUCTION_COMPLETED;
    }
    if (
      status === IndentStatus.PENDING_ACCOUNTS &&
      indent &&
      indent.remarks &&
      indent.remarks.includes('[ACTUAL_COST_UPDATED]')
    ) {
      return WorkflowState.ACTUAL_COST_UPDATED;
    }
    return this.PRISMA_TO_DOMAIN_MAP[status] || WorkflowState.DRAFT;
  }
}
