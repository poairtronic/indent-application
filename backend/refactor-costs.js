const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/business-transaction/services/business-transaction.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

const targetFunction = /public async enterActualCosts\([\s\S]*?\n  }/;
let functionMatch = content.match(targetFunction);
if (!functionMatch) {
  console.log("Could not find enterActualCosts");
  process.exit(1);
}

let funcBody = functionMatch[0];

const newFuncBody = funcBody.replace(
  /await this\.prisma\.\$transaction\(async \(tx\) => \{[\s\S]*?\/\/ 1\. Update target CostItem/,
  `// Fetch ProcessCosts and CostItems OUTSIDE transaction
      const processCosts = await this.prisma.processCost.findMany({
        where: { costSheetId: costSheetId, isDeleted: false },
      });
      const costItems = await this.prisma.costItem.findMany({
        where: { costSheetId: costSheetId, isDeleted: false },
      });

      await this.prisma.$transaction(async (tx) => {
        let totalMaterialActual = 0;
        let totalProcessActual = 0;

        // 1. Update target CostItem`
);

// We need to also replace the existing costItems and processCosts reads inside the transaction loop:
// Actually, `enterActualCosts` currently does:
// `const costItem = await tx.costItem.findUnique(...)` in a loop!
// Let's rewrite `enterActualCosts` completely because rewriting it with regex is hard.
const replacement = `  public async enterActualCosts(id: string, userId: string, dto: any): Promise<any> {
    const txData = await this.getCostContext(id);
    const targetState = WorkflowState.ACTUAL_COST_UPDATED;

    const transitionValidation = this.workflowStateMachine.validateTransition(
      txData.currentState,
      targetState,
      'ACCOUNTS',
    );
    if (!transitionValidation.isValid) {
      throw new BadRequestException(transitionValidation.errors.join(', '));
    }

    if (!txData.costSheet) {
      throw new NotFoundException(\`Process Cost Sheet for Indent ID '\${id}' not found.\`);
    }

    const costSheetId = txData.costSheet.id;
    const prismaTargetStatus = WorkflowStateMapper.toPrisma(targetState);

    // READS OUTSIDE TRANSACTION
    const currentCostItems = await this.prisma.costItem.findMany({
      where: { costSheetId },
    });
    const currentProcessCosts = await this.prisma.processCost.findMany({
      where: { costSheetId },
    });

    await this.prisma.$transaction(async (tx) => {
      let totalMaterialActual = 0;
      let totalProcessActual = 0;

      // 1. Update CostItems
      if (dto.costItems && Array.isArray(dto.costItems)) {
        for (const cDto of dto.costItems) {
          const actualRate = roundTo4Decimals(cDto.actualRate);
          const actualQuantity = roundTo4Decimals(cDto.actualQuantity);
          const actualAmount = roundTo4Decimals(actualRate * actualQuantity);

          const cItem = currentCostItems.find(i => i.id === cDto.costItemId);
          if (cItem) {
            const predictedAmount = roundTo4Decimals(cItem.predictedAmount);
            const varianceAmount = safeSubtract(actualAmount, predictedAmount);
            const variancePercentage = safeVariancePercentage(varianceAmount, predictedAmount);

            await tx.costItem.update({
              where: { id: cDto.costItemId },
              data: {
                actualRate,
                actualQuantity,
                actualAmount,
                varianceAmount,
                variancePercentage,
                remarks: cDto.remarks,
                updatedBy: userId,
              },
            });
          }
          totalMaterialActual = safeAdd([totalMaterialActual, actualAmount]);
        }
      }

      // 2. Update ProcessCosts
      if (dto.processCosts && Array.isArray(dto.processCosts)) {
        for (const pDto of dto.processCosts) {
          const actualCost = roundTo4Decimals(pDto.actualCost);
          const actualHours = roundTo4Decimals(pDto.actualHours);
          const actualAmount = roundTo4Decimals(actualCost * actualHours);

          const pItem = currentProcessCosts.find(i => i.id === pDto.processCostId);
          if (pItem) {
            const predictedAmount = roundTo4Decimals(pItem.predictedAmount);
            const varianceAmount = safeSubtract(actualAmount, predictedAmount);
            const variancePercentage = safeVariancePercentage(varianceAmount, predictedAmount);

            await tx.processCost.update({
              where: { id: pDto.processCostId },
              data: {
                actualCost,
                actualHours,
                actualAmount,
                varianceAmount,
                variancePercentage,
                remarks: pDto.remarks,
                updatedBy: userId,
              },
            });
          }
          totalProcessActual = safeAdd([totalProcessActual, actualAmount]);
        }
      }

      // 3. Overall CostSheet updates
      const actualDesignCost =
        dto.actualDesignCost !== undefined && dto.actualDesignCost !== null
          ? roundTo4Decimals(dto.actualDesignCost)
          : roundTo4Decimals(txData.costSheet.actualDesignCost || 0);

      const actualOverheadCost =
        dto.actualOverheadCost !== undefined && dto.actualOverheadCost !== null
          ? roundTo4Decimals(dto.actualOverheadCost)
          : roundTo4Decimals(txData.costSheet.actualOverheadCost || 0);

      const actualContingencyCost =
        dto.actualContingencyCost !== undefined && dto.actualContingencyCost !== null
          ? roundTo4Decimals(dto.actualContingencyCost)
          : roundTo4Decimals(txData.costSheet.actualContingencyCost || 0);

      const actualTotal = safeAdd([
        totalMaterialActual,
        totalProcessActual,
        actualDesignCost,
        actualOverheadCost,
        actualContingencyCost,
      ]);

      const predictedTotal = roundTo4Decimals(txData.costSheet.predictedTotal || 0);
      const varianceAmount = safeSubtract(actualTotal, predictedTotal);
      const variancePercentage = safeVariancePercentage(varianceAmount, predictedTotal);

      await tx.costSheet.update({
        where: { id: costSheetId },
        data: {
          actualDesignCost,
          actualOverheadCost,
          actualContingencyCost,
          actualTotal,
          varianceAmount,
          variancePercentage,
          status: 'ACTUAL_COST_UPDATED',
          updatedBy: userId,
        },
      });

      await this.assertCurrentStateAndUpdate(
        id,
        txData.currentState,
        {
          status: prismaTargetStatus,
          currentState: targetState,
          remarks: \`\${txData.remarks || ''}\\nActual costs entered. Total Variance: \${variancePercentage}%\`,
          updatedBy: userId,
        },
        tx,
      );

      await tx.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks: \`Actual costs entered and variances calculated (\${variancePercentage}% variance).\`,
        },
      });
    });

    await this.eventService.dispatchNotification(id, txData.indentNumber, targetState, userId);
    await this.eventService.logAudit(
      AuditEventType.ACTUAL_COST_ENTERED,
      id,
      userId,
      { predictedTotal: txData.costSheet.predictedTotal },
      { actualCostEntered: true, costSheetId, state: targetState },
    );

    this.invalidateCostCache();
    return { id, success: true };
  }`;

content = content.replace(targetFunction, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log('enterActualCosts refactored successfully.');
