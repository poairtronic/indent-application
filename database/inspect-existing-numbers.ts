import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_JvSpdWilRA28@ep-morning-tooth-ax8knfkj-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  },
});

async function main() {
  const indents = await prisma.indent.findMany({
    select: { id: true, indentNumber: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Found ${indents.length} indents:`);
  indents.forEach((i, idx) => console.log(`  [${idx + 1}] ID: ${i.id}, Number: ${i.indentNumber}, Date: ${i.createdAt.toISOString()}`));

  const costSheets = await prisma.costSheet.findMany({
    select: { id: true, costNumber: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Found ${costSheets.length} cost sheets:`);
  costSheets.forEach((cs, idx) => console.log(`  [${idx + 1}] ID: ${cs.id}, Number: ${cs.costNumber}, Date: ${cs.createdAt.toISOString()}`));

  const materials = await prisma.material.findMany({
    select: { id: true, materialCode: true, materialName: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Found ${materials.length} materials:`);
  materials.slice(0, 10).forEach((m, idx) => console.log(`  [${idx + 1}] ID: ${m.id}, Code: ${m.materialCode}, Name: ${m.materialName}`));

  const products = await prisma.product.findMany({
    select: { id: true, productCode: true, productName: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Found ${products.length} products:`);
  products.slice(0, 10).forEach((p, idx) => console.log(`  [${idx + 1}] ID: ${p.id}, Code: ${p.productCode}, Name: ${p.productName}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
