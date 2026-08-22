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
      createdBy: null,
      createdAt: indent.createdAt,
      updatedAt: indent.updatedAt,
      items: indent.indentItems || [],
      attachments: [],
      costSheet: indent.costSheet || null,
      productionReceipt: null,
      workflowHistory: [],
      allowedNextStates: stageDef ? stageDef.allowedNextStates : [],
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
  }

`;

const startStr = '  private async getTransactionContext(id: string): Promise<any> {';

const startIndex = content.indexOf(startStr);
const endRegex = /\s*\/\*\*\s*\n\s*\*\s*List all Business Transactions/g;
const match = endRegex.exec(content);

if (startIndex === -1 || !match) {
  console.log('Could not find start or end bounds for replacement.');
  process.exit(1);
}

const endIndex = match.index;

content = content.substring(0, startIndex) + getBaseContextFunc + content.substring(endIndex);

// Update callers
content = content.replace(/this\.getTransactionContext\(id\)/g, (match, offset, str) => {
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
  return match;
});


fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced getTransactionContext successfully.');
