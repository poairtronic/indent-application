import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.indentItem.findMany({
    where: { remarks: { not: null } },
    take: 5,
    include: {
      indentProcesses: {
        include: { process: true }
      }
    }
  });
  
  for (const item of items) {
    console.log(item.remarks);
    console.log(item.indentProcesses);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
