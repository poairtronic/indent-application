const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/business-transaction/services/business-transaction.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

const targetFunction = /public async storesIssueMaterials\([\s\S]*?\n  }/;
let functionMatch = content.match(targetFunction);
if (!functionMatch) {
  console.log("Could not find storesIssueMaterials");
  process.exit(1);
}

let funcBody = functionMatch[0];

const newFuncBody = funcBody.replace(
  /await this\.prisma\.\$transaction\(async \(prisma\) => \{([\s\S]*?)\/\/ 1\. Fetch active indent items \(narrow select\)[\s\S]*?\/\/ 2\. Batch-fetch all needed materials[\s\S]*?\/\/ 3\. Validate stock and prepare updates/,
  `// 1. Fetch active indent items OUTSIDE transaction
      const itemsToIssue = await this.prisma.indentItem.findMany({
        where: { indentId: id, isDeleted: false },
        select: { id: true, materialId: true, quantity: true, issuedQuantity: true, status: true },
      });

      // 2. Batch-fetch all needed materials OUTSIDE transaction
      const nonIssuedMaterialIds = [...new Set(
        itemsToIssue.filter((item) => item.status !== 'ISSUED').map((item) => item.materialId),
      )];
      const materials = nonIssuedMaterialIds.length > 0
        ? await this.prisma.material.findMany({ where: { id: { in: nonIssuedMaterialIds } } })
        : [];
      const materialMap = new Map(materials.map((m) => [m.id, m]));

      await this.prisma.$transaction(async (prisma) => {
        let allItemsComplete = true;
        const issues = dto.issueItems || [];
        const materialUpdates: Promise<any>[] = [];
        const itemUpdates: Promise<any>[] = [];

        // 3. Validate stock and prepare updates`
);

content = content.replace(funcBody, newFuncBody);
fs.writeFileSync(filePath, content, 'utf8');
console.log('storesIssueMaterials refactored successfully.');
