import { Injectable } from '@nestjs/common';
import { WorkflowStateTransitionValidator } from '../validators/workflow-state-transition.validator';
import { WorkflowState } from '../enums/workflow-state.enum';
import {
  WORKFLOW_STAGE_DEFINITIONS,
  StageDefinition,
} from '../definitions/workflow-state-machine.definition';
import {
  NOTIFICATION_EVENT_RULES,
  NotificationEventRule,
} from '../definitions/notification-event.definition';
import { IBusinessValidationResult } from '../interfaces/business-transaction.interface';
import { observabilityEventBus } from '../../observability/observability-event-bus';

/**
 * WorkflowStateMachineService Foundation (Phase 12A - Structure Only)
 * Encapsulates Two-Loop workflow state transition validation and notification rule lookup.
 */
@Injectable()
export class WorkflowStateMachineService {
  constructor(private readonly transitionValidator: WorkflowStateTransitionValidator) {}

  /**
   * Get metadata definition for a workflow stage.
   */
  public getStageDefinition(state: WorkflowState): StageDefinition {
    return WORKFLOW_STAGE_DEFINITIONS[state];
  }

  /**
   * Get allowed next states for a current workflow state.
   */
  public getAllowedNextStates(state: WorkflowState): WorkflowState[] {
    const def = WORKFLOW_STAGE_DEFINITIONS[state];
    return def ? def.allowedNextStates : [];
  }

  /**
   * Validate if a state transition is legal according to 2-Loop rules.
   */
  public validateTransition(
    currentState: WorkflowState,
    targetState: WorkflowState,
    userDepartmentCode: string,
  ): IBusinessValidationResult {
    const startTime = Date.now();
    const result = this.transitionValidator.validateTransition(
      currentState,
      targetState,
      userDepartmentCode,
    );
    const duration = Date.now() - startTime;

    observabilityEventBus.emit('workflow.transition', {
      fromState: currentState,
      toState: targetState,
      success: result.isValid,
      duration,
      error: result.isValid ? undefined : result.errors.join(', '),
    });

    return result;
  }

  /**
   * Resolve notification event rule associated with a stage transition.
   */
  public getNotificationRule(targetState: WorkflowState): NotificationEventRule | null {
    return NOTIFICATION_EVENT_RULES[targetState] || null;
  }
}
