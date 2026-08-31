const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const jobs = await prisma.emailJob.findMany({
    where: { status: 'PENDING' },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, attempts: true, lastError: true }
  });
  console.log(JSON.stringify(jobs, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
