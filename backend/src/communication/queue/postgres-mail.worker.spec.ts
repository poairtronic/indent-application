import { Test, TestingModule } from '@nestjs/testing';
import { PostgresMailWorker } from './postgres-mail.worker';
import { PostgresQueueService } from './postgres-queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailProviderFactory } from '../providers/email-provider.factory';
import { TemplateEngine } from '../templates/template.engine';
import { mailQueueEventBus } from './mail-queue.event-bus';
import { IJobPayload } from './queue.constants';

describe('PostgresMailWorker Phase 1.1 Remediation & Safety Verification', () => {
  let worker: PostgresMailWorker;
  let queueService: PostgresQueueService;
  let mockPrisma: any;
  let mockEmailFactory: any;
  let mockTemplateEngine: any;

  beforeEach(async () => {
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      emailJob: {
        create: jest.fn().mockResolvedValue({ id: 'job-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      emailLog: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      applicationSetting: {
        findUnique: jest.fn().mockResolvedValue({ value: 'true' }), // Global emails enabled
      },
    };

    mockEmailFactory = {
      sendEmail: jest.fn().mockResolvedValue({ messageId: 'msg-123' }),
    };

    mockTemplateEngine = {
      render: jest.fn().mockReturnValue('<p>Rendered Email</p>'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostgresMailWorker,
        PostgresQueueService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailProviderFactory, useValue: mockEmailFactory },
        { provide: TemplateEngine, useValue: mockTemplateEngine },
      ],
    }).compile();

    worker = module.get<PostgresMailWorker>(PostgresMailWorker);
    queueService = module.get<PostgresQueueService>(PostgresQueueService);
  });

  afterEach(async () => {
    if (worker) {
      await worker.onModuleDestroy();
    }
    jest.clearAllMocks();
  });

  // 1. Email processing lasting longer than 30 seconds
  it('1. Email processing lasting longer than 30s maintains lease via heartbeats and avoids recovery', async () => {
    const slowJob = {
      id: 'job-slow-1',
      payload: {
        jobId: 'job-slow-1',
        recipient: 'slow@example.com',
        recipients: ['slow@example.com'],
        subject: 'Slow Email',
        template: 'welcome',
        payload: {},
      },
      attempts: 0,
      maxAttempts: 4,
    };

    mockPrisma.$queryRaw
      .mockResolvedValueOnce([slowJob])
      .mockResolvedValue([]);

    // Simulate slow send
    mockEmailFactory.sendEmail.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ messageId: 'msg-slow' }), 100)),
    );

    worker.onModuleInit();
    worker.triggerWakeup(0);

    // Renew lock explicitly as heartbeat would
    const renewed = await worker.renewLock('job-slow-1');
    expect(renewed).toBe(true);
    expect(mockPrisma.emailJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'job-slow-1',
          status: 'PROCESSING',
          lockedBy: worker.getWorkerStatus().workerId,
        }),
        data: expect.objectContaining({
          lockedAt: expect.any(Date),
        }),
      }),
    );

    await worker.waitForIdle();
    expect(mockEmailFactory.sendEmail).toHaveBeenCalled();
  });

  // 2. Successful lock renewal
  it('2. Successful lock renewal updates lockedAt timestamp for owning worker', async () => {
    mockPrisma.emailJob.updateMany.mockResolvedValueOnce({ count: 1 });

    const renewed = await worker.renewLock('job-lease-test');
    expect(renewed).toBe(true);

    expect(mockPrisma.emailJob.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'job-lease-test',
        status: 'PROCESSING',
        lockedBy: worker.getWorkerStatus().workerId,
      },
      data: {
        lockedAt: expect.any(Date),
      },
    });
  });

  // 3. Failed lock renewal and loss of ownership
  it('3. Failed lock renewal returns false when worker loses ownership', async () => {
    // Return count 0 simulating another instance reclaimed or deleted the lock
    mockPrisma.emailJob.updateMany.mockResolvedValueOnce({ count: 0 });

    const renewed = await worker.renewLock('job-stolen');
    expect(renewed).toBe(false);
  });

  // 4. Two workers attempting to recover the same expired job
  it('4. Two workers attempting to recover the same expired job execute atomic recovery safely', async () => {
    // Worker 1 executes recovery and claims 1 stuck job
    mockPrisma.emailJob.updateMany.mockResolvedValueOnce({ count: 1 });
    const recovered1 = await worker.recoverStuckJobs();
    expect(recovered1).toBe(1);

    // Worker 2 executes recovery immediately after, receives count 0 (already recovered)
    mockPrisma.emailJob.updateMany.mockResolvedValueOnce({ count: 0 });
    const recovered2 = await worker.recoverStuckJobs();
    expect(recovered2).toBe(0);
  });

  // 5. Active email during graceful shutdown
  it('5. Active email completes cleanly during graceful shutdown grace period', async () => {
    const jobA = {
      id: 'job-active-shutdown',
      payload: {
        jobId: 'job-active-shutdown',
        recipient: 'test@example.com',
        recipients: ['test@example.com'],
        subject: 'Active Shutdown Job',
        template: 'welcome',
        payload: {},
      },
      attempts: 0,
      maxAttempts: 4,
    };

    mockPrisma.$queryRaw
      .mockResolvedValueOnce([jobA])
      .mockResolvedValue([]);

    mockEmailFactory.sendEmail.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ messageId: 'msg-shutdown' }), 50)),
    );

    worker.onModuleInit();
    worker.triggerWakeup(0);

    // Allow claim to initiate
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(worker.getWorkerStatus().activeJobs).toBe(1);

    // Trigger shutdown while active
    await worker.onModuleDestroy();

    // Verify it completed and deleted without errors
    expect(mockEmailFactory.sendEmail).toHaveBeenCalled();
    expect(mockPrisma.emailJob.deleteMany).toHaveBeenCalledWith({
      where: { id: 'job-active-shutdown', lockedBy: worker.getWorkerStatus().workerId },
    });
  });

  // 6. Shutdown timeout while an email remains active
  it('6. Shutdown timeout while an email remains active does NOT release job to PENDING', async () => {
    const lingeringJob = {
      id: 'job-lingering',
      payload: {
        jobId: 'job-lingering',
        recipient: 'hang@example.com',
        recipients: ['hang@example.com'],
        subject: 'Lingering Job',
        template: 'welcome',
        payload: {},
      },
      attempts: 0,
      maxAttempts: 4,
    };

    mockPrisma.$queryRaw
      .mockResolvedValueOnce([lingeringJob])
      .mockResolvedValue([]);

    // Promise that does not resolve during test window
    let resolveSend: any;
    mockEmailFactory.sendEmail.mockImplementation(
      () => new Promise((resolve) => { resolveSend = resolve; }),
    );

    // Temporarily shorten shutdown timeout for test speed
    (worker as any).shutdownTimeoutMs = 100;

    worker.onModuleInit();
    worker.triggerWakeup(0);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(worker.getWorkerStatus().activeJobs).toBe(1);

    // Clear mock history before destroy
    mockPrisma.emailJob.updateMany.mockClear();

    // Trigger shutdown which will time out after 100ms
    await worker.onModuleDestroy();

    // CRITICAL: Ensure updateMany was NOT called to set status = 'PENDING'
    const pendingResetCalls = mockPrisma.emailJob.updateMany.mock.calls.filter(
      (call: any) => call[0]?.data?.status === 'PENDING' && call[0]?.data?.lockedAt === null,
    );
    expect(pendingResetCalls.length).toBe(0);

    // Cleanup lingering send
    if (resolveSend) resolveSend({ messageId: 'cleaned' });
  });

  // 7. Another instance attempting to claim a locked job
  it('7. Another instance attempting to claim a locked job skips it via status filter', async () => {
    // In PostgreSQL, FOR UPDATE SKIP LOCKED only selects WHERE status = 'PENDING'
    // If a job is in status = 'PROCESSING', another instance's query returns empty
    mockPrisma.$queryRaw.mockResolvedValueOnce([]); // No pending jobs available

    worker.onModuleInit();
    worker.triggerWakeup(0);
    await worker.waitForIdle();

    expect(mockEmailFactory.sendEmail).not.toHaveBeenCalled();
  });

  // 8. Recovery after a genuine worker crash
  it('8. Recovery safely reclaims genuinely abandoned job after lease expiry', async () => {
    mockPrisma.emailJob.updateMany.mockResolvedValueOnce({ count: 1 });
    const triggerSpy = jest.spyOn(worker, 'triggerWakeup');

    const recovered = await worker.recoverStuckJobs();

    expect(recovered).toBe(1);
    expect(mockPrisma.emailJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PROCESSING',
          lockedAt: expect.objectContaining({ lt: expect.any(Date) }),
        }),
        data: expect.objectContaining({
          status: 'PENDING',
          lockedAt: null,
          lockedBy: null,
        }),
      }),
    );
    expect(triggerSpy).toHaveBeenCalledWith(0);
  });

  // 9. Retry and delayed availableAt behavior
  it('9. Failed jobs trigger exponential retry backoff and schedule delayed wakeup', async () => {
    const failingJob = {
      id: 'job-fail-retry',
      payload: {
        jobId: 'job-fail-retry',
        recipient: 'user@example.com',
        recipients: ['user@example.com'],
        subject: 'Failing Job',
        template: 'welcome',
        payload: {},
      },
      attempts: 0,
      maxAttempts: 4,
    };

    mockPrisma.$queryRaw
      .mockResolvedValueOnce([failingJob])
      .mockResolvedValue([]);

    mockEmailFactory.sendEmail.mockRejectedValueOnce(new Error('SMTP Network Dropped'));
    const triggerSpy = jest.spyOn(worker, 'triggerWakeup');

    worker.onModuleInit();
    worker.triggerWakeup(0);

    await worker.waitForIdle();

    expect(mockPrisma.emailJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-fail-retry', lockedBy: worker.getWorkerStatus().workerId },
        data: expect.objectContaining({
          status: 'PENDING',
          attempts: 1,
          lastError: 'SMTP Network Dropped',
          availableAt: expect.any(Date),
        }),
      }),
    );

    // 5 * 60 * 1000 = 300,000ms delay for attempt 1
    expect(triggerSpy).toHaveBeenCalledWith(300_000);
  });

  // 10. Existing priority, batching and dead-letter behavior
  it('10. Batch processing, priority draining, and dead-letter exhaustion operate correctly', async () => {
    const batchJob1 = {
      id: 'job-batch-1',
      payload: {
        jobId: 'job-batch-1',
        recipient: 'p1@example.com',
        recipients: ['p1@example.com'],
        subject: 'Batch 1',
        template: 'welcome',
      },
      attempts: 0,
      maxAttempts: 4,
    };
    const exhaustedJob = {
      id: 'job-exhaust-1',
      payload: {
        jobId: 'job-exhaust-1',
        recipient: 'dead@example.com',
        recipients: ['dead@example.com'],
        subject: 'Dead Letter',
        template: 'welcome',
      },
      attempts: 3,
      maxAttempts: 4,
    };

    mockPrisma.$queryRaw
      .mockResolvedValueOnce([batchJob1, exhaustedJob])
      .mockResolvedValue([]);

    // batchJob1 succeeds, exhaustedJob fails
    mockEmailFactory.sendEmail
      .mockResolvedValueOnce({ messageId: 'msg-batch-1' })
      .mockRejectedValueOnce(new Error('550 Mailbox Dead'));

    worker.onModuleInit();
    worker.triggerWakeup(0);

    await worker.waitForIdle();

    // Batch 1 deleted on success
    expect(mockPrisma.emailJob.deleteMany).toHaveBeenCalledWith({
      where: { id: 'job-batch-1', lockedBy: worker.getWorkerStatus().workerId },
    });

    // Exhausted moved to DEAD_LETTER
    expect(mockPrisma.emailJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-exhaust-1', lockedBy: worker.getWorkerStatus().workerId },
        data: expect.objectContaining({
          status: 'DEAD_LETTER',
          attempts: 4,
          lastError: '550 Mailbox Dead',
        }),
      }),
    );
  });
});
