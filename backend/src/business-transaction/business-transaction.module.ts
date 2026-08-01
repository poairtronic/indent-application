import { Module } from '@nestjs/common';
import { IndentSheetValidator } from './validators/indent-sheet.validator';
import { ProcessCostSheetValidator } from './validators/process-cost-sheet.validator';
import { BusinessTransactionValidator } from './validators/business-transaction.validator';
import { WorkflowStateTransitionValidator } from './validators/workflow-state-transition.validator';
import { BusinessTransactionService } from './services/business-transaction.service';
import { WorkflowStateMachineService } from './services/workflow-state-machine.service';

@Module({
  providers: [
    IndentSheetValidator,
    ProcessCostSheetValidator,
    BusinessTransactionValidator,
    WorkflowStateTransitionValidator,
    BusinessTransactionService,
    WorkflowStateMachineService,
  ],
  exports: [
    IndentSheetValidator,
    ProcessCostSheetValidator,
    BusinessTransactionValidator,
    WorkflowStateTransitionValidator,
    BusinessTransactionService,
    WorkflowStateMachineService,
  ],
})
export class BusinessTransactionModule {}
