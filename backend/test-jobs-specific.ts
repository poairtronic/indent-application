import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const job = await prisma.emailJob.findUnique({
    where: { id: 'c5ca8571-0dc7-4751-a652-9a4f0ad1e27c' },
  });
  console.info(JSON.stringify(job, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
