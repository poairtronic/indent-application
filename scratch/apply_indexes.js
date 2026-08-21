import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Applying composite indexes on indents table...');
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_indents_deleted_state_created 
    ON indents ("isDeleted", "currentState", "createdAt" DESC);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_indents_deleted_created 
    ON indents ("isDeleted", "createdAt" DESC);
  `);

  console.log('Indexes created successfully!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
