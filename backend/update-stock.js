const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.material.updateMany({
    data: { currentStock: 1000000 },
  });
  console.log('Stock updated to 1000000 for all materials.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
