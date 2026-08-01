import { Module } from '@nestjs/common';
import { BusinessTransactionController } from './business-transaction.controller';
import { IndentSheetValidator } from './validators/indent-sheet.validator';
import { ProcessCostSheetValidator } from './validators/process-cost-sheet.validator';
import { BusinessTransactionValidator } from './validators/business-transaction.validator';
import { WorkflowStateTransitionValidator } from './validators/workflow-state-transition.validator';
import { BusinessTransactionService } from './services/business-transaction.service';
import { WorkflowStateMachineService } from './services/workflow-state-machine.service';
import { BusinessTransactionEventService } from './services/business-transaction-event.service';

@Module({
  controllers: [BusinessTransactionController],
  providers: [
    IndentSheetValidator,
    ProcessCostSheetValidator,
    BusinessTransactionValidator,
    WorkflowStateTransitionValidator,
    BusinessTransactionService,
    WorkflowStateMachineService,
    BusinessTransactionEventService,
  ],
  exports: [
    IndentSheetValidator,
    ProcessCostSheetValidator,
    BusinessTransactionValidator,
    WorkflowStateTransitionValidator,
    BusinessTransactionService,
    WorkflowStateMachineService,
    BusinessTransactionEventService,
  ],
})
export class BusinessTransactionModule {}
