import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const jobs = await prisma.emailJob.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });
  console.info(
    JSON.stringify(
      jobs.map((j) => ({ id: j.id, lastError: j.lastError })),
      null,
      2,
    ),
  );
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
