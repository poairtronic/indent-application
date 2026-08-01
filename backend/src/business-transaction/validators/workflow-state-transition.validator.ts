import { Injectable } from '@nestjs/common';
import { WorkflowState } from '../enums/workflow-state.enum';
import { WORKFLOW_STAGE_DEFINITIONS } from '../definitions/workflow-state-machine.definition';
import { IBusinessValidationResult } from '../interfaces/business-transaction.interface';

@Injectable()
export class WorkflowStateTransitionValidator {
  public validateTransition(
    currentState: WorkflowState,
    targetState: WorkflowState,
    userDepartmentCode: string,
  ): IBusinessValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const currentDef = WORKFLOW_STAGE_DEFINITIONS[currentState];
    const targetDef = WORKFLOW_STAGE_DEFINITIONS[targetState];

    if (!currentDef) {
      errors.push(`Invalid current workflow state: ${currentState}`);
      return { isValid: false, errors, warnings };
    }

    if (!targetDef) {
      errors.push(`Invalid target workflow state: ${targetState}`);
      return { isValid: false, errors, warnings };
    }

    if (currentDef.isTerminalState) {
      errors.push(`Cannot transition from terminal state ${currentState}.`);
      return { isValid: false, errors, warnings };
    }

    if (!currentDef.allowedNextStates.includes(targetState)) {
      errors.push(
        `Direct state transition from ${currentState} to ${targetState} is not allowed by 2-Loop Workflow State Machine rules. Allowed next states: [${currentDef.allowedNextStates.join(', ')}].`,
      );
    }

    // Validate department ownership (except SYSTEM automated states)
    if (
      currentDef.owningDepartmentCode !== 'SYSTEM' &&
      currentDef.owningDepartmentCode !== userDepartmentCode
    ) {
      errors.push(
        `Department ${userDepartmentCode} is not authorized to trigger transition from ${currentState}. Required department: ${currentDef.owningDepartmentCode}.`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
