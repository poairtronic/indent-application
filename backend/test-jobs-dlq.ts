import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const jobs = await prisma.emailJob.findMany({
    where: { status: 'DEAD_LETTER' },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });
  console.info(
    JSON.stringify(
      jobs.map((j) => ({
        id: j.id,
        status: j.status,
        attempts: j.attempts,
        lastError: j.lastError,
      })),
      null,
      2,
    ),
  );
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
