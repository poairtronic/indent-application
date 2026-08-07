import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from '../queue.service';
import { QueueProcessor } from '../queue.processor';
import { PrismaService } from '../../../prisma/prisma.service';
import { NodemailerProvider } from '../../providers/nodemailer.provider';
import { TemplateEngine } from '../../templates/template.engine';
import { EmailState, IJobPayload } from '../queue.constants';

// ─────────────────────────────────────────────
// JEST MOCKS
// ─────────────────────────────────────────────

jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: 'job-id-123' }),
      close: jest.fn(),
      on: jest.fn(),
      getActiveCount: jest.fn().mockResolvedValue(1),
      getCompletedCount: jest.fn().mockResolvedValue(5),
      getFailedCount: jest.fn().mockResolvedValue(2),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
      getJobCountByTypes: jest.fn().mockResolvedValue(1),
    })),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn(),
    })),
  };
});

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
  }));
});

const mockPrisma = {
  emailLog: {
    updateMany: jest.fn(),
  },
};

const mockNodemailerProvider = {
  sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-nodemailer-123' }),
};

const mockTemplateEngine = {
  render: jest.fn().mockReturnValue('<html>Email rendered</html>'),
};

describe('Enterprise Email Delivery Pipeline (Queue & Worker)', () => {
  let queueService: QueueService;
  let processor: QueueProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        QueueProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NodemailerProvider, useValue: mockNodemailerProvider },
        { provide: TemplateEngine, useValue: mockTemplateEngine },
      ],
    }).compile();

    queueService = module.get<QueueService>(QueueService);
    processor = module.get<QueueProcessor>(QueueProcessor);

    queueService.onModuleInit();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await queueService.onModuleDestroy();
  });

  describe('QueueService (Producer)', () => {
    it('should successfully add email jobs with priority options', async () => {
      const payload: IJobPayload = {
        jobId: 'job-123',
        recipient: 'test@imcms.com',
        recipients: ['test@imcms.com'],
        template: 'welcome',
        subject: 'Welcome',
        businessEvent: 'USER_REGISTERED',
        payload: { name: 'User' },
        priority: 1,
        retryCount: 0,
        createdTime: new Date().toISOString(),
        requestedBy: 'SYSTEM',
        correlationId: 'corr-123',
      };

      const result = await queueService.addJob(payload);
      expect(result).toBeDefined();
      expect(result.id).toBe('job-id-123');
    });

    it('should query correct metrics stats from BullMQ instances', async () => {
      const stats = await queueService.getQueueStats();
      expect(stats.active).toBe(1);
      expect(stats.completed).toBe(5);
      expect(stats.failed).toBe(2);
      expect(stats.dead).toBe(1);
    });

    it('should return UP on successful Redis connection ping', async () => {
      const status = await queueService.checkRedisHealth();
      expect(status).toBe('UP');
    });
  });

  describe('QueueProcessor (Consumer & Retry Strategy)', () => {
    it('should complete SMTP dispatch successfully and finalize database log state', async () => {
      const payload: IJobPayload = {
        jobId: 'job-123',
        recipient: 'test@imcms.com',
        recipients: ['test@imcms.com'],
        template: 'welcome',
        subject: 'Welcome',
        businessEvent: 'USER_REGISTERED',
        payload: { name: 'User' },
        priority: 3,
        retryCount: 0,
        createdTime: new Date().toISOString(),
        requestedBy: 'SYSTEM',
        correlationId: 'corr-123',
      };

      await processor.processJob(payload);

      expect(mockTemplateEngine.render).toHaveBeenCalledWith('welcome', payload.payload);
      expect(mockNodemailerProvider.sendEmail).toHaveBeenCalled();
      expect(mockPrisma.emailLog.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-123' },
          data: expect.objectContaining({ status: EmailState.SENT }),
        }),
      );
    });

    it('should trigger retry logic on SMTP delivery failure', async () => {
      mockNodemailerProvider.sendEmail.mockRejectedValueOnce(new Error('SMTP Offline'));
      const addJobSpy = jest.spyOn(queueService, 'addJob');

      const payload: IJobPayload = {
        jobId: 'job-123',
        recipient: 'test@imcms.com',
        recipients: ['test@imcms.com'],
        template: 'welcome',
        subject: 'Welcome',
        businessEvent: 'USER_REGISTERED',
        payload: { name: 'User' },
        priority: 3,
        retryCount: 0, // Attempt #1 failed
        createdTime: new Date().toISOString(),
        requestedBy: 'SYSTEM',
        correlationId: 'corr-123',
      };

      await processor.processJob(payload);

      // Should add job back to queue with delay
      expect(addJobSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 'job-123',
          retryCount: 1,
        }),
        0, // Attempt 1 delay is 0
      );
    });

    it('should move to DLQ when max retries are exceeded', async () => {
      mockNodemailerProvider.sendEmail.mockRejectedValueOnce(new Error('SMTP Hard Fail'));
      const addDeadSpy = jest.spyOn(queueService, 'addDeadJob');

      const payload: IJobPayload = {
        jobId: 'job-123',
        recipient: 'test@imcms.com',
        recipients: ['test@imcms.com'],
        template: 'welcome',
        subject: 'Welcome',
        businessEvent: 'USER_REGISTERED',
        payload: { name: 'User' },
        priority: 3,
        retryCount: 4, // Max retry attempt limit exceeded
        createdTime: new Date().toISOString(),
        requestedBy: 'SYSTEM',
        correlationId: 'corr-123',
      };

      await processor.processJob(payload);

      // Should write to DLQ
      expect(addDeadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 'job-123',
          retryCount: 5,
        }),
      );
    });
  });
});
