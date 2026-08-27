import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';
import { PostgresMailWorker } from './src/communication/queue/postgres-mail.worker';
import { CommunicationService } from './src/communication/communication.service';

import * as crypto from 'crypto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const commService = app.get(CommunicationService);
  const worker = app.get(PostgresMailWorker);

  console.info('--- STARTING P0 EMAIL TOGGLE & QUEUE SEMANTICS TEST MATRIX ---');

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Clear old jobs so they don't block concurrency
  await prisma.emailJob.deleteMany({});
  await prisma.emailLog.deleteMany({});
  console.info('[SETUP] Cleared old email_jobs and email_logs');

  const setGlobalEmail = async (enabled: boolean) => {
    await prisma.applicationSetting.upsert({
      where: { key: 'GLOBAL_EMAIL_NOTIFICATIONS_ENABLED' },
      update: { value: enabled ? 'true' : 'false' },
      create: {
        key: 'GLOBAL_EMAIL_NOTIFICATIONS_ENABLED',
        value: enabled ? 'true' : 'false',
        category: 'Email',
      },
    });
    console.info(`[STATE] GLOBAL_EMAIL_NOTIFICATIONS_ENABLED = ${enabled}`);
  };

  const waitForLogStatus = async (
    subject: string,
    notStatus: string = 'QUEUED',
    maxWait: number = 15000,
  ) => {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      const l = await prisma.emailLog.findFirst({
        where: { subject },
        orderBy: { sentAt: 'desc' },
      });
      if (l && l.status !== notStatus) return l;
      await wait(500);
    }
    return await prisma.emailLog.findFirst({ where: { subject }, orderBy: { sentAt: 'desc' } });
  };

  const waitForJobStatus = async (
    id: string,
    notStatus: string = 'PENDING',
    maxWait: number = 15000,
  ) => {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      const j = await prisma.emailJob.findUnique({ where: { id } });
      if (!j || j.status !== notStatus) return j;
      await wait(500);
    }
    return await prisma.emailJob.findUnique({ where: { id } });
  };

  try {
    // TEST A
    console.info('\n--- TEST A: Normal Dispatch ---');
    await setGlobalEmail(true);
    let result = await commService.sendEmail({
      to: 'test-a@example.com',
      subject: 'Test A',
      templateName: 'welcome',
      templateContext: { name: 'Test A', loginUrl: 'test' },
    });
    if (!result.success || !result.jobId) throw new Error('TEST A: Failed to create job');

    await (worker as any).poll();
    let log = await waitForLogStatus('Test A');

    if (log?.status === 'QUEUED') {
      console.error('TEST A FAILED: Job not processed properly (status: ' + log?.status + ')');
    } else {
      console.info('TEST A PASSED: Job processed (Result: ' + log?.status + ')');
    }

    // TEST B
    console.info('\n--- TEST B: OFF blocks creation ---');
    await setGlobalEmail(false);
    result = await commService.sendEmail({
      to: 'test-b@example.com',
      subject: 'Test B',
      templateName: 'welcome',
    });
    if (result.success === true) {
      console.error('TEST B FAILED: Job created when OFF');
    } else {
      console.info('TEST B PASSED: Job creation blocked');
    }

    // TEST C
    console.info('\n--- TEST C: Old job suppressed when OFF ---');
    await setGlobalEmail(true);
    const testCJobId = crypto.randomUUID();
    const testCLogId = crypto.randomUUID();

    await prisma.emailLog.create({
      data: {
        id: testCLogId,
        to: 'test-c@example.com',
        subject: 'Test C',
        body: 'Test C',
        status: 'QUEUED',
      },
    });
    await prisma.emailJob.create({
      data: {
        id: testCJobId,
        payload: {
          jobId: testCJobId,
          emailLogIds: [testCLogId],
          recipient: 'test-c@example.com',
          subject: 'Test C',
          body: 'Test C',
        },
        status: 'PENDING',
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
      },
    });

    await setGlobalEmail(false); // Turn OFF
    await (worker as any).poll(); // Worker picks it up

    const job = await waitForJobStatus(testCJobId);
    log = await prisma.emailLog.findUnique({ where: { id: testCLogId } });

    if (job?.status === 'DEAD_LETTER' && log?.status === 'DEAD_LETTER') {
      console.info('TEST C PASSED: Old job was permanently suppressed');
    } else {
      console.error(`TEST C FAILED: Job status ${job?.status}, Log status ${log?.status}`);
    }

    // TEST E
    console.info('\n--- TEST E: Email ON resumes normal behavior ---');
    await setGlobalEmail(true);
    result = await commService.sendEmail({
      to: 'test-e@example.com',
      subject: 'Test E',
      templateName: 'welcome',
      templateContext: { name: 'Test E', loginUrl: 'test' },
    });

    await (worker as any).poll();
    log = await waitForLogStatus('Test E');

    if (log?.status === 'QUEUED') {
      console.error('TEST E FAILED: Job not processed normally (status: ' + log?.status + ')');
    } else {
      console.info('TEST E PASSED: New job processed normally (Status: ' + log?.status + ')');
    }

    const testCJobAfterE = await prisma.emailJob.findUnique({ where: { id: testCJobId } });
    if (testCJobAfterE?.status !== 'DEAD_LETTER') {
      console.error('TEST C POST-CHECK FAILED: Job C resumed improperly!');
    } else {
      console.info('TEST C POST-CHECK PASSED: Job C remained dead.');
    }
  } catch (e) {
    console.error('TEST SCRIPT ERROR:', e);
  } finally {
    await setGlobalEmail(true); // Restore
    await app.close();
  }
}

bootstrap();
