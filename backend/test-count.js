const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const id = 'd24bba76-4806-487c-baa8-439ccf301f5b';
  
  // Check unissued count
  const unissuedCount = await prisma.indentItem.count({
    where: { indentId: id, isDeleted: false, status: { not: 'ISSUED' } },
  });
  console.log('Unissued Count:', unissuedCount);
}
test().catch(console.error).finally(() => prisma.$disconnect());
