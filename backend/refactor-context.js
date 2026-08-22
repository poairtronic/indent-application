const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/business-transaction/services/business-transaction.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

const getBaseContextFunc = `  private getBaseSelect() {
    return {
      id: true,
      indentNumber: true,
      customerName: true,
      layoutNumber: true,
      departmentId: true,
      priority: true,
      status: true,
      currentState: true,
      requiredDate: true,
      requiredDeliveryDate: true,
      purpose: true,
      remarks: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  private mapBaseContext(indent: any) {
    const domainState = WorkflowStateMapper.toDomain(indent.status, indent);
    const stageDef = this.workflowStateMachine.getStageDefinition(domainState);

    return {
      id: indent.id,
      indentNumber: indent.indentNumber,
      customerName: indent.customerName,
      layoutNumber: indent.layoutNumber,
      departmentId: indent.departmentId,
      priority: indent.priority,
      currentState: domainState,
      currentLoop: stageDef ? stageDef.loop : WorkflowLoop.MANUFACTURING_LOOP,
      requiredDate: indent.requiredDate,
      requiredDeliveryDate: indent.requiredDeliveryDate,
      purpose: indent.purpose,
      remarks: indent.remarks,
      createdAt: indent.createdAt,
      updatedAt: indent.updatedAt,
      items: indent.indentItems || [],
      costSheet: indent.costSheet || null,
    };
  }

  private async getTransactionContext(id: string): Promise<any> {
    const indent = await this.prisma.indent.findUnique({
      where: { id },
      select: this.getBaseSelect(),
    });

    if (!indent) {
      throw new NotFoundException(\`Business Transaction with ID '\${id}' not found.\`);
    }

    return this.mapBaseContext(indent);
  }

  private async getStoresContext(id: string): Promise<any> {
    const indent = await this.prisma.indent.findUnique({
      where: { id },
      select: {
        ...this.getBaseSelect(),
        indentItems: {
          where: { isDeleted: false },
          select: {
            id: true,
            materialId: true,
            unitId: true,
            quantity: true,
            status: true,
            remarks: true,
            material: { select: { materialName: true } },
          },
        },
      },
    });

    if (!indent) {
      throw new NotFoundException(\`Business Transaction with ID '\${id}' not found.\`);
    }

    return this.mapBaseContext(indent);
  }

  private async getCostContext(id: string): Promise<any> {
    const indent = await this.prisma.indent.findUnique({
      where: { id },
      select: {
        ...this.getBaseSelect(),
        costSheet: {
          select: {
            id: true,
            actualDesignCost: true,
            actualOverheadCost: true,
            actualContingencyCost: true,
            predictedTotal: true,
          },
        },
      },
    });

    if (!indent) {
      throw new NotFoundException(\`Business Transaction with ID '\${id}' not found.\`);
    }

    return this.mapBaseContext(indent);
  }`;

// Find the getTransactionContext function bounds
const startIdx = content.indexOf('private async getTransactionContext');
const endIdx = content.indexOf('public async getDashboardMetrics') > -1 
  ? content.indexOf('public async getDashboardMetrics') // wait, it's before that. Let's find exactly where it ends.
  : content.indexOf('public async getDashboardStats') > -1 ? content.indexOf('public async getDashboardStats') : -1;
// Wait, a better way to replace the whole function:
const regex = /private async getTransactionContext[\s\S]*?return \{\s*id: indent\.id,[\s\S]*?createdAt: indent\.createdAt,\s*updatedAt: indent\.updatedAt,\s*\};\s*\}/;

content = content.replace(regex, getBaseContextFunc);

// Now update callers
content = content.replace(/this\.getTransactionContext\(id\)/g, (match, offset, str) => {
  // Let's check which function we are in
  const before = str.substring(0, offset);
  if (before.includes('public async storesVerifyStock') && before.lastIndexOf('public async storesVerifyStock') > before.lastIndexOf('}')) {
    return 'this.getStoresContext(id)';
  }
  if (before.includes('public async issueSingleMaterialItem') && before.lastIndexOf('public async issueSingleMaterialItem') > before.lastIndexOf('}')) {
    return 'this.getStoresContext(id)';
  }
  if (before.includes('public async enterActualCosts') && before.lastIndexOf('public async enterActualCosts') > before.lastIndexOf('}')) {
    return 'this.getCostContext(id)';
  }
  if (before.includes('public async updateMaterialActualCosts') && before.lastIndexOf('public async updateMaterialActualCosts') > before.lastIndexOf('}')) {
    return 'this.getCostContext(id)';
  }
  if (before.includes('public async financialClosure') && before.lastIndexOf('public async financialClosure') > before.lastIndexOf('}')) {
    return 'this.getCostContext(id)';
  }
  if (before.includes('public async uploadAttachmentToIndent') && before.lastIndexOf('public async uploadAttachmentToIndent') > before.lastIndexOf('}')) {
    return 'this.getCostContext(id)';
  }
  return match; // keep getTransactionContext for the rest
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactored getTransactionContext successfully.');
