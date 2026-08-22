const fs = require('fs');
let content = fs.readFileSync('src/business-transaction/services/business-transaction.service.ts', 'utf8');

content = content.replace(
  /if \(\s*txData\.currentState === WorkflowState\.DESIGN_COMPLETED \|\|\s*txData\.currentState === WorkflowState\.STORES_PROCESSING\s*\) \{/,
  `if (
          txData.currentState === WorkflowState.DESIGN_COMPLETED ||
          txData.currentState === WorkflowState.STORES_PROCESSING
        ) {
          let currentState = txData.currentState;
          if (currentState === WorkflowState.DESIGN_COMPLETED) {
            // First transition to STORES_PROCESSING
            await this.prisma.indent.update({
              where: { id },
              data: {
                status: WorkflowStateMapper.toPrisma(WorkflowState.STORES_PROCESSING),
                currentState: WorkflowState.STORES_PROCESSING,
                updatedBy: userId,
              },
            });
            currentState = WorkflowState.STORES_PROCESSING;
          }`
);

content = content.replace(
  /const transitionValidation = this\.workflowStateMachine\.validateTransition\(\s*txData\.currentState,\s*targetState,\s*'STORES',\s*\);/,
  `const transitionValidation = this.workflowStateMachine.validateTransition(
            currentState,
            targetState,
            'STORES',
          );`
);

content = content.replace(
  /await this\.assertCurrentStateAndUpdate\(\s*id,\s*txData\.currentState,\s*\{/,
  `await this.assertCurrentStateAndUpdate(
              id,
              currentState,
              {`
);

fs.writeFileSync('src/business-transaction/services/business-transaction.service.ts', content);
