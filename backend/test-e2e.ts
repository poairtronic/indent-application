import { PostgresQueueService } from './src/communication/queue/postgres-queue.service';
import { PrismaService } from './src/prisma/prisma.service';
import { PostgresMailWorker } from './src/communication/queue/postgres-mail.worker';
import { EmailProviderFactory } from './src/communication/providers/email-provider.factory';
import { GmailApiProvider } from './src/communication/providers/gmail-api.provider';
import { TemplateEngine } from './src/communication/templates/template.engine';
import * as dotenv from 'dotenv';
dotenv.config();

async function runE2E() {
  const prisma = new PrismaService();
  const queue = new PostgresQueueService(prisma);
  const gmailProvider = new GmailApiProvider();
  const factory = new EmailProviderFactory(gmailProvider);
  const templateEngine = new TemplateEngine();
  
  const worker = new PostgresMailWorker(prisma, factory, templateEngine);
  
  const jobIdStr = 'e2e-job-' + Date.now();
  console.log(`[1] Inserting job ${jobIdStr} into PostgreSQL queue...`);
  
  await queue.addJob({
    jobId: jobIdStr,
    recipient: 'test@example.com',
    recipients: ['test@example.com'],
    template: 'TEST_TEMPLATE',
    subject: 'IMCMS Phase 8 E2E Test',
    body: 'Test body',
    html: '<p>End-to-end integration test.</p>',
    businessEvent: 'TEST_EVENT',
    payload: {},
    priority: 1,
    retryCount: 0,
    createdTime: new Date().toISOString(),
    requestedBy: 'SYSTEM',
    correlationId: 'corr-' + Date.now()
  });
  
  // Also force update availableAt to 1 hour ago just in case of clock skew
  await prisma.$executeRaw`UPDATE email_jobs SET "availableAt" = NOW() - INTERVAL '1 hour' WHERE id = ${jobIdStr}`;
  
  let job = await prisma.emailJob.findUnique({ where: { id: jobIdStr }});
  console.log(`[2] Job queued, initial status: ${job?.status}`);

  console.log('[3] Triggering worker poll manually...');
  const claimedCount = await (worker as any).poll();
  console.log(`[4] Worker claimed ${claimedCount} job(s).`);
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  job = await prisma.emailJob.findUnique({ where: { id: jobIdStr }});
  if (!job) {
     console.log('[5] Job is no longer in emailJob table (successfully deleted after SENT).');
  } else {
     console.log(`[5] Job status after poll: ${job?.status}, error: ${job?.lastError}`);
  }
}

runE2E().catch(console.error).finally(() => process.exit(0));
