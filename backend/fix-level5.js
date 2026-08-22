const fs = require('fs');
const path = require('path');

const target = 'src/business-transaction/services/business-transaction.service.ts';
let code = fs.readFileSync(target, 'utf8');

// 1. Optimize storesIssueMaterials loop
const storesIssueSearch = `      const inventoryLogs = [];
      for (const item of txData.indentItems) {
        const material = await prisma.material.findUnique({
          where: { id: item.materialId },
        });

        const requiredQty = item.quantity;
        if (material.currentStock < requiredQty) {
          throw new BadRequestException(
            \`Insufficient stock for material \${material.materialName} (Requested: \${requiredQty}, Available: \${material.currentStock})\`,
          );
        }

        inventoryLogs.push({
          materialId: material.id,
          transactionType: 'ISSUE',
          quantity: requiredQty,
          indentNumber: txData.indentNumber,
          referenceId: id,
          performedBy: userId,
        });

        // 2. Decrement authoritative stock safely using interactive transaction
        await prisma.material.update({
          where: { id: material.id },
          data: {
            currentStock: { decrement: requiredQty },
            updatedBy: userId,
          },
        });
      }

      // 3. Batch insert inventory logs
      await prisma.inventoryLog.createMany({
        data: inventoryLogs,
      });`;

const storesIssueReplace = `      // 1. Batch lookup materials
      const materialIds = txData.indentItems.map((i) => i.materialId);
      const materials = await prisma.material.findMany({
        where: { id: { in: materialIds } },
      });
      const materialMap = new Map(materials.map((m) => [m.id, m]));

      const inventoryLogs = [];
      const stockUpdates = new Map();

      for (const item of txData.indentItems) {
        const material = materialMap.get(item.materialId);
        const requiredQty = item.quantity;
        
        const currentDecrements = stockUpdates.get(material.id) || 0;
        if (material.currentStock < currentDecrements + requiredQty) {
          throw new BadRequestException(
            \`Insufficient stock for material \${material.materialName} (Requested: \${requiredQty}, Available: \${material.currentStock})\`,
          );
        }
        
        stockUpdates.set(material.id, currentDecrements + requiredQty);

        inventoryLogs.push({
          materialId: material.id,
          transactionType: 'ISSUE',
          quantity: requiredQty,
          indentNumber: txData.indentNumber,
          referenceId: id,
          performedBy: userId,
        });
      }

      // 2. Parallelize decrement authoritative stock using interactive transaction
      const updatePromises = Array.from(stockUpdates.entries()).map(([mId, qty]) => {
         return prisma.material.update({
           where: { id: mId },
           data: { currentStock: { decrement: qty }, updatedBy: userId },
         });
      });
      await Promise.all(updatePromises);

      // 3. Batch insert inventory logs
      await prisma.inventoryLog.createMany({
        data: inventoryLogs,
      });`;

code = code.replace(storesIssueSearch, storesIssueReplace);

// 2. Wrap productionCompleteWork in transaction
const prodCompleteSearch = `    await this.assertCurrentStateAndUpdate(id, txData.currentState, {
      status: prismaTargetStatus,
      currentState: targetState,
      remarks: \`\${txData.remarks || ''}\\n[PRODUCTION_COMPLETED] Manufacturing completed. \${remarks ? \`Notes: \${remarks}\` : ''}\`,
      updatedBy: userId,
    });
    await this.prisma.workflowHistory.create({
      data: {
        indentId: id,
        toDepartmentId: txData.departmentId,
        movedBy: userId,
        remarks: remarks || 'Production completed manufacturing.',
      },
    });`;

const prodCompleteReplace = `    await this.prisma.$transaction(async (tx) => {
      await this.assertCurrentStateAndUpdate(id, txData.currentState, {
        status: prismaTargetStatus,
        currentState: targetState,
        remarks: \`\${txData.remarks || ''}\\n[PRODUCTION_COMPLETED] Manufacturing completed. \${remarks ? \`Notes: \${remarks}\` : ''}\`,
        updatedBy: userId,
      }, tx);
      await tx.workflowHistory.create({
        data: {
          indentId: id,
          toDepartmentId: txData.departmentId,
          movedBy: userId,
          remarks: remarks || 'Production completed manufacturing.',
        },
      });
    });`;

code = code.replace(prodCompleteSearch, prodCompleteReplace);

// 3. Parallelize actualCosts loop
const actualCostSearch = `        // 1. Update CostItems actual rate, quantity, and amount
        if (dto.costItems && dto.costItems.length > 0) {
          for (const ciDto of dto.costItems) {
            if ((ciDto.actualRate || 0) < 0 || (ciDto.actualQuantity || 0) < 0) {
              throw new BadRequestException('Actual rates and quantities must be non-negative.');
            }
            const actualRate = roundTo4Decimals(ciDto.actualRate ?? 0);
            const actualQuantity = roundTo4Decimals(ciDto.actualQuantity ?? 0);
            const actualAmount = safeMultiply(actualRate, actualQuantity);
            totalMaterialActual = safeAdd([totalMaterialActual, actualAmount]);
            await tx.costItem.update({
              where: { id: ciDto.costItemId },
              data: {
                actualRate,
                actualQuantity,
                actualAmount,
                updatedBy: userId,
              },
            });
          }
        }

        // 2. Update ProcessCosts actual cost and hours
        if (dto.processCosts && dto.processCosts.length > 0) {
          for (const pcDto of dto.processCosts) {
            if ((pcDto.actualCost || 0) < 0 || (pcDto.actualHours || 0) < 0) {
              throw new BadRequestException('Actual costs and hours must be non-negative.');
            }
            const actualCost = roundTo4Decimals(pcDto.actualCost ?? 0);
            const actualHours = roundTo4Decimals(pcDto.actualHours ?? 0);
            totalProcessActual = safeAdd([totalProcessActual, actualCost]);
            await tx.processCost.update({
              where: { id: pcDto.processCostId },
              data: {
                actualCost,
                actualHours,
                updatedBy: userId,
              },
            });
          }
        }`;

const actualCostReplace = `        // 1. Update CostItems actual rate, quantity, and amount
        const costItemUpdates = [];
        if (dto.costItems && dto.costItems.length > 0) {
          for (const ciDto of dto.costItems) {
            if ((ciDto.actualRate || 0) < 0 || (ciDto.actualQuantity || 0) < 0) {
              throw new BadRequestException('Actual rates and quantities must be non-negative.');
            }
            const actualRate = roundTo4Decimals(ciDto.actualRate ?? 0);
            const actualQuantity = roundTo4Decimals(ciDto.actualQuantity ?? 0);
            const actualAmount = safeMultiply(actualRate, actualQuantity);
            totalMaterialActual = safeAdd([totalMaterialActual, actualAmount]);
            costItemUpdates.push(
              tx.costItem.update({
                where: { id: ciDto.costItemId },
                data: {
                  actualRate,
                  actualQuantity,
                  actualAmount,
                  updatedBy: userId,
                },
              })
            );
          }
        }

        // 2. Update ProcessCosts actual cost and hours
        const processCostUpdates = [];
        if (dto.processCosts && dto.processCosts.length > 0) {
          for (const pcDto of dto.processCosts) {
            if ((pcDto.actualCost || 0) < 0 || (pcDto.actualHours || 0) < 0) {
              throw new BadRequestException('Actual costs and hours must be non-negative.');
            }
            const actualCost = roundTo4Decimals(pcDto.actualCost ?? 0);
            const actualHours = roundTo4Decimals(pcDto.actualHours ?? 0);
            totalProcessActual = safeAdd([totalProcessActual, actualCost]);
            processCostUpdates.push(
              tx.processCost.update({
                where: { id: pcDto.processCostId },
                data: {
                  actualCost,
                  actualHours,
                  updatedBy: userId,
                },
              })
            );
          }
        }
        
        await Promise.all([...costItemUpdates, ...processCostUpdates]);`;

code = code.replace(actualCostSearch, actualCostReplace);

fs.writeFileSync(target, code, 'utf8');
console.log('Level 5 loop optimizations applied');
