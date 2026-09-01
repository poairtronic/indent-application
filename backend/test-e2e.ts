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
  
  // Insert with status PROCESSING so the remote worker doesn't steal it
  await prisma.emailJob.create({
    data: {
      id: jobIdStr,
      payload: {
        jobId: jobIdStr,
        recipient: 'posuppportairtronic@gmail.com',
        recipients: ['posuppportairtronic@gmail.com'],
        template: 'TEST_TEMPLATE',
        subject: 'IMCMS Gmail API Local Test',
        body: 'This is a controlled local Gmail API production-provider test.',
        html: '<p>This is a controlled local Gmail API production-provider test.</p>',
        businessEvent: 'TEST_EVENT',
        payload: {},
        priority: 1,
        retryCount: 0,
        createdTime: new Date().toISOString(),
        requestedBy: 'SYSTEM',
        correlationId: 'corr-' + Date.now()
      },
      status: 'PROCESSING',
      priority: 1,
      availableAt: new Date(),
      lockedAt: new Date(),
      lockedBy: worker['workerId'],
      attempts: 0,
      maxAttempts: 4
    }
  });
  
  console.log(`[2] Job inserted with status PROCESSING and locked to local worker`);

  console.log('[3] Triggering worker.processJob manually...');
  // Type casting to bypass private method for testing purpose
  const job = {
    id: jobIdStr,
    payload: (await prisma.emailJob.findUnique({ where: { id: jobIdStr } }))?.payload,
    attempts: 0,
    maxAttempts: 4
  };

  await (worker as any).processJob(job);
  console.log(`[4] processJob returned.`);
  
  const updatedJob = await prisma.emailJob.findUnique({ where: { id: jobIdStr }});
  if (!updatedJob) {
     console.log('[5] Job is no longer in emailJob table (successfully deleted after SENT).');
  } else {
     console.log(`[5] Job status after poll: ${updatedJob?.status}, error: ${updatedJob?.lastError}`);
  }
}

runE2E().catch(console.error).finally(() => process.exit(0));
