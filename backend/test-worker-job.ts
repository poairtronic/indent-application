import { PostgresQueueService } from './src/communication/queue/postgres-queue.service';
import { PrismaService } from './src/prisma/prisma.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function runWorkerTest() {
  const prisma = new PrismaService();
  const queue = new PostgresQueueService(prisma);
  
  const jobIdStr = 'test-job-' + Date.now();
  console.log('Inserting job into queue...', jobIdStr);
  
  await queue.addJob({
    jobId: jobIdStr,
    recipients: ['test@example.com'],
    subject: 'Worker Test',
    html: '<p>Worker integration test.</p>',
    priority: 1
  });
  
  console.log('Job queued');
  const job = await prisma.emailJob.findUnique({ where: { id: jobIdStr }});
  console.log('Job initially:', job?.status);
}

runWorkerTest().catch(console.error).finally(() => process.exit(0));
