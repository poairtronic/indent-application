import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        'postgresql://neondb_owner:npg_JvSpdWilRA28@ep-morning-tooth-ax8knfkj-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  },
});

const COMPANY_CODE = 'AGIPL';

function formatSeq(num: number, minDigits = 3): string {
  return num.toString().padStart(minDigits, '0');
}

async function backfill() {
  console.log('=== STARTING MERC ENTERPRISE DOCUMENT NUMBER BACKFILL ===');

  // 1. Backfill Materials (Global sequence)
  const materials = await prisma.material.findMany({
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Backfilling ${materials.length} Materials...`);
  for (let i = 0; i < materials.length; i++) {
    const mat = materials[i];
    const newCode = `${COMPANY_CODE}-MAT-${formatSeq(i + 1)}`;
    await prisma.material.update({
      where: { id: mat.id },
      data: { materialCode: newCode },
    });
    console.log(`  Material [${mat.id}]: ${mat.materialCode} -> ${newCode}`);
  }

  // Update or insert Material sequence
  const nextMaterialNumber = materials.length + 1;
  await prisma.$executeRaw`
    INSERT INTO "document_sequences" ("id", "documentType", "year", "nextNumber", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'MATERIAL', 0, ${nextMaterialNumber}, NOW(), NOW())
    ON CONFLICT ("documentType", "year")
    DO UPDATE SET "nextNumber" = ${nextMaterialNumber}, "updatedAt" = NOW()
  `;
  console.log(`Set MATERIAL sequence nextNumber to ${nextMaterialNumber}`);

  // 2. Backfill Products (Global sequence)
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Backfilling ${products.length} Products...`);
  for (let i = 0; i < products.length; i++) {
    const prd = products[i];
    const newCode = `${COMPANY_CODE}-PRD-${formatSeq(i + 1)}`;
    await prisma.product.update({
      where: { id: prd.id },
      data: { productCode: newCode },
    });
    console.log(`  Product [${prd.id}]: ${prd.productCode} -> ${newCode}`);
  }

  // Update or insert Product sequence
  const nextProductNumber = products.length + 1;
  await prisma.$executeRaw`
    INSERT INTO "document_sequences" ("id", "documentType", "year", "nextNumber", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'PRODUCT', 0, ${nextProductNumber}, NOW(), NOW())
    ON CONFLICT ("documentType", "year")
    DO UPDATE SET "nextNumber" = ${nextProductNumber}, "updatedAt" = NOW()
  `;
  console.log(`Set PRODUCT sequence nextNumber to ${nextProductNumber}`);

  // 3. Backfill Indents (Year-based sequence)
  const indents = await prisma.indent.findMany({
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Backfilling ${indents.length} Indents...`);
  const indentYearCounters: Record<number, number> = {};

  for (const indent of indents) {
    const year = new Date(indent.createdAt).getFullYear();
    indentYearCounters[year] = (indentYearCounters[year] || 0) + 1;
    const seq = indentYearCounters[year];
    const newNumber = `${COMPANY_CODE}-IND-${year}-${formatSeq(seq)}`;

    await prisma.indent.update({
      where: { id: indent.id },
      data: { indentNumber: newNumber },
    });
    console.log(`  Indent [${indent.id}]: ${indent.indentNumber} -> ${newNumber}`);
  }

  for (const [yearStr, count] of Object.entries(indentYearCounters)) {
    const year = parseInt(yearStr, 10);
    const nextNumber = count + 1;
    await prisma.$executeRaw`
      INSERT INTO "document_sequences" ("id", "documentType", "year", "nextNumber", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'INDENT', ${year}, ${nextNumber}, NOW(), NOW())
      ON CONFLICT ("documentType", "year")
      DO UPDATE SET "nextNumber" = ${nextNumber}, "updatedAt" = NOW()
    `;
    console.log(`Set INDENT (${year}) sequence nextNumber to ${nextNumber}`);
  }

  // 4. Backfill Cost Sheets (Year-based sequence)
  const costSheets = await prisma.costSheet.findMany({
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Backfilling ${costSheets.length} Cost Sheets...`);
  const csYearCounters: Record<number, number> = {};

  for (const cs of costSheets) {
    const year = new Date(cs.createdAt).getFullYear();
    csYearCounters[year] = (csYearCounters[year] || 0) + 1;
    const seq = csYearCounters[year];
    const newNumber = `${COMPANY_CODE}-CS-${year}-${formatSeq(seq)}`;

    await prisma.costSheet.update({
      where: { id: cs.id },
      data: { costNumber: newNumber },
    });
    console.log(`  CostSheet [${cs.id}]: ${cs.costNumber} -> ${newNumber}`);
  }

  for (const [yearStr, count] of Object.entries(csYearCounters)) {
    const year = parseInt(yearStr, 10);
    const nextNumber = count + 1;
    await prisma.$executeRaw`
      INSERT INTO "document_sequences" ("id", "documentType", "year", "nextNumber", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'COST_SHEET', ${year}, ${nextNumber}, NOW(), NOW())
      ON CONFLICT ("documentType", "year")
      DO UPDATE SET "nextNumber" = ${nextNumber}, "updatedAt" = NOW()
    `;
    console.log(`Set COST_SHEET (${year}) sequence nextNumber to ${nextNumber}`);
  }

  console.log('=== MERC DOCUMENT NUMBER BACKFILL COMPLETED SUCCESSFULLY ===');
}

backfill()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
