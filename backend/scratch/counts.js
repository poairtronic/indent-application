const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const models = [
    'User', 'Role', 'Permission', 'Department', 'Vendor', 'Unit', 'Material', 'Product', 'ManufacturingProcess',
    'Indent', 'IndentItem', 'CostSheet', 'CostItem', 'ProcessCost', 'IndentBroughtMaterial', 'IndentProcess',
    'WorkflowHistory', 'EmailLog', 'EmailJob', 'IndentAttachment'
  ];
  const counts = {};
  for (const model of models) {
    if (prisma[model.charAt(0).toLowerCase() + model.slice(1)]) {
        counts[model] = await prisma[model.charAt(0).toLowerCase() + model.slice(1)].count();
    }
  }
  console.log(JSON.stringify(counts, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
