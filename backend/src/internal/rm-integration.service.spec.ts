import { Test, TestingModule } from '@nestjs/testing';
import {
  RmIntegrationService,
  DEFAULT_RM_OUTBOX_CRON_SCHEDULE,
  RM_OUTBOX_LOCK_KEY,
} from './rm-integration.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RmIntegrationService', () => {
  let service: RmIntegrationService;
  let mockPrisma: any;
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    process.env = { ...originalEnv };

    mockPrisma = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      applicationSetting: {
        upsert: jest.fn().mockResolvedValue({ key: RM_OUTBOX_LOCK_KEY, value: '0' }),
        findUnique: jest.fn().mockResolvedValue({ key: RM_OUTBOX_LOCK_KEY, value: '0' }),
        update: jest.fn().mockResolvedValue({ key: RM_OUTBOX_LOCK_KEY, value: '0' }),
      },
      indent: {
        findUnique: jest.fn(),
      },
      rmWebhookOutbox: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'outbox-uuid-1',
            ...data,
          }),
        ),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'outbox-uuid-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RmIntegrationService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<RmIntegrationService>(RmIntegrationService);
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('should be defined with correct default status and 4-hour schedule', () => {
    expect(service).toBeDefined();
    const status = service.getSchedulerStatus();
    expect(status.cronSchedule).toBe(DEFAULT_RM_OUTBOX_CRON_SCHEDULE);
    expect(status.cronSchedule).toBe('0 0 */4 * * *');
    expect(status.isRetrying).toBe(false);
    expect(status.startupRetryEnabled).toBe(true);
  });

  it('should fail outbox gracefully if RM_API_URL or RM_INTERNAL_SECRET is missing', async () => {
    delete process.env.RM_API_URL;
    delete process.env.RM_INTERNAL_SECRET;

    mockPrisma.indent.findUnique.mockResolvedValue({
      id: 'indent-1',
      indentNumber: 'IND-001',
      indentItems: [],
      broughtMaterials: [],
    });

    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    await expect(service.notifyStoresPending('indent-1')).resolves.not.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockPrisma.rmWebhookOutbox.create).toHaveBeenCalled();
    expect(mockPrisma.rmWebhookOutbox.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'outbox-uuid-1' },
        data: expect.objectContaining({
          status: 'FAILED',
          lastError: 'Missing env vars',
        }),
      }),
    );
  });

  it('should skip gracefully if indent is not found', async () => {
    process.env.RM_API_URL = 'http://localhost:4000';
    process.env.RM_INTERNAL_SECRET = 'test-secret';

    mockPrisma.indent.findUnique.mockResolvedValue(null);

    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    await expect(service.notifyStoresPending('indent-nonexistent')).resolves.not.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockPrisma.rmWebhookOutbox.create).not.toHaveBeenCalled();
  });

  it('should format line items, save to outbox, and send webhook to RM', async () => {
    process.env.RM_API_URL = 'http://localhost:4000/';
    process.env.RM_INTERNAL_SECRET = 'rm-secret-123';

    const mockIndent = {
      id: 'indent-uuid-1',
      indentNumber: 'IND-2026-001',
      customerName: 'Acme Corp',
      layoutNumber: 'LAY-100',
      currentState: 'STORES_PROCESSING',
      indentItems: [
        {
          id: 'item-raw-1',
          quantity: 10,
          shape: 'ROUND',
          lengthMm: 150,
          diameterMm: 25,
          material: { materialName: 'Aluminium 6061' },
          unit: { unitName: 'Nos' },
        },
      ],
      broughtMaterials: [
        {
          id: 'item-bo-1',
          name: 'Bearing 6204',
          quantity: 4,
        },
      ],
    };

    mockPrisma.indent.findUnique.mockResolvedValue(mockIndent);

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('OK'),
    });
    global.fetch = fetchMock;

    await service.notifyStoresPending('indent-uuid-1');

    expect(mockPrisma.rmWebhookOutbox.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          indentId: 'indent-uuid-1',
          indentNumber: 'IND-2026-001',
          status: 'PENDING',
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/api/internal/merc/indent-pending',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': 'rm-secret-123',
        },
      }),
    );

    expect(mockPrisma.rmWebhookOutbox.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'outbox-uuid-1' },
        data: expect.objectContaining({
          status: 'SENT',
        }),
      }),
    );
  });

  it('should mark outbox as FAILED when response is non-OK', async () => {
    process.env.RM_API_URL = 'http://localhost:4000';
    process.env.RM_INTERNAL_SECRET = 'rm-secret-123';

    const mockIndent = {
      id: 'indent-uuid-1',
      indentNumber: 'IND-2026-001',
      indentItems: [],
      broughtMaterials: [],
    };

    mockPrisma.indent.findUnique.mockResolvedValue(mockIndent);

    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('Internal error on RM'),
    });
    global.fetch = fetchMock;

    await expect(service.notifyStoresPending('indent-uuid-1')).resolves.not.toThrow();

    expect(mockPrisma.rmWebhookOutbox.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'outbox-uuid-1' },
        data: expect.objectContaining({
          status: 'FAILED',
          lastError: 'HTTP 500: Internal error on RM',
        }),
      }),
    );
  });

  it('should mark outbox as FAILED when network throws an error', async () => {
    process.env.RM_API_URL = 'http://localhost:4000';
    process.env.RM_INTERNAL_SECRET = 'rm-secret-123';

    const mockIndent = {
      id: 'indent-uuid-1',
      indentNumber: 'IND-2026-001',
      indentItems: [],
      broughtMaterials: [],
    };

    mockPrisma.indent.findUnique.mockResolvedValue(mockIndent);

    const fetchMock = jest.fn().mockRejectedValue(new Error('Connection refused'));
    global.fetch = fetchMock;

    await expect(service.notifyStoresPending('indent-uuid-1')).resolves.not.toThrow();

    expect(mockPrisma.rmWebhookOutbox.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'outbox-uuid-1' },
        data: expect.objectContaining({
          status: 'FAILED',
          lastError: 'Connection refused',
        }),
      }),
    );
  });

  it('should retry failed outbox entries', async () => {
    process.env.RM_API_URL = 'http://localhost:4000';
    process.env.RM_INTERNAL_SECRET = 'rm-secret-123';

    const failedEntry = {
      id: 'outbox-entry-1',
      payload: { indentNumber: 'IND-001' },
      status: 'FAILED',
      attemptCount: 1,
    };
    mockPrisma.rmWebhookOutbox.findMany.mockResolvedValue([failedEntry]);
    mockPrisma.rmWebhookOutbox.findUnique.mockResolvedValue(failedEntry);

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('OK'),
    });
    global.fetch = fetchMock;

    await service.retryFailedOutbox();

    expect(mockPrisma.rmWebhookOutbox.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { status: 'FAILED', attemptCount: { lt: 5 } },
          {
            status: 'PENDING',
            createdAt: expect.any(Object),
            attemptCount: { lt: 5 },
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });
    expect(fetchMock).toHaveBeenCalled();
  });

  it('should execute cron handleOutboxRetry without errors', async () => {
    const retrySpy = jest.spyOn(service, 'retryFailedOutbox').mockResolvedValue({
      retriedCount: 0,
      successCount: 0,
    });
    await service.handleOutboxRetry();
    expect(retrySpy).toHaveBeenCalled();
  });

  it('should return outbox status', async () => {
    mockPrisma.rmWebhookOutbox.findMany.mockResolvedValue([
      { id: '1', status: 'SENT' },
      { id: '2', status: 'FAILED' },
    ]);

    const res = await service.getOutboxStatus(50);
    expect(res).toHaveLength(2);
    expect(mockPrisma.rmWebhookOutbox.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  // ==========================================
  // PHASE 3 OPTIMIZATION & RESILIENCE TESTS
  // ==========================================

  describe('Phase 3 Concurrency & Lock Protection', () => {
    it('should skip retry sweep if another instance holds the distributed lock', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(0); // 0 rows updated -> lock held

      const result = await service.retryFailedOutbox();

      expect(result.skippedReason).toBe('LOCK_HELD_BY_ANOTHER_INSTANCE');
      expect(result.retriedCount).toBe(0);
      expect(mockPrisma.rmWebhookOutbox.findMany).not.toHaveBeenCalled();
    });

    it('should skip retry sweep if local process is already running a sweep', async () => {
      (service as any).isRetrying = true;

      const result = await service.retryFailedOutbox();

      expect(result.skippedReason).toBe('ALREADY_RUNNING_LOCALLY');
      expect(result.retriedCount).toBe(0);
      expect(mockPrisma.rmWebhookOutbox.findMany).not.toHaveBeenCalled();
    });

    it('should prevent concurrent duplicate send of the same in-flight outbox entry', async () => {
      process.env.RM_API_URL = 'http://localhost:4000';
      process.env.RM_INTERNAL_SECRET = 'rm-secret-123';

      (service as any).inFlightSends.add('outbox-in-flight-1');

      const result = await service.sendOutboxEntry('outbox-in-flight-1', { data: 123 });

      expect(result).toBe(false);
      expect(mockPrisma.rmWebhookOutbox.update).not.toHaveBeenCalled();
    });
  });

  describe('Phase 3 Idle Optimization & Empty Outbox Handling', () => {
    it('should cleanly handle empty outbox with zero HTTP dispatches', async () => {
      mockPrisma.rmWebhookOutbox.findMany.mockResolvedValue([]);

      const result = await service.retryFailedOutbox();

      expect(result.skippedReason).toBe('NO_ELIGIBLE_ENTRIES');
      expect(result.retriedCount).toBe(0);
      expect(result.successCount).toBe(0);
    });
  });

  describe('Phase 3 Startup Recovery & Lifecycle', () => {
    it('should schedule startup recovery timer on application bootstrap', () => {
      jest.useFakeTimers();
      const retrySpy = jest.spyOn(service, 'retryFailedOutbox').mockResolvedValue({
        retriedCount: 0,
        successCount: 0,
      });

      service.onApplicationBootstrap();
      expect((service as any).startupTimer).toBeDefined();

      jest.advanceTimersByTime(15000);
      expect(retrySpy).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should cancel startup timer cleanly on module destroy', () => {
      jest.useFakeTimers();
      service.onApplicationBootstrap();
      expect((service as any).startupTimer).toBeDefined();

      service.onModuleDestroy();
      expect((service as any).startupTimer).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('Phase 3 Network Timeout & Database Failure Recovery', () => {
    it('should handle HTTP timeout signal and record FAILED status', async () => {
      process.env.RM_API_URL = 'http://localhost:4000';
      process.env.RM_INTERNAL_SECRET = 'rm-secret-123';

      const timeoutError = new Error('The operation was aborted due to timeout');
      timeoutError.name = 'TimeoutError';
      global.fetch = jest.fn().mockRejectedValue(timeoutError);

      const success = await service.sendOutboxEntry('outbox-timeout-1', { indentNumber: 'IND-999' });

      expect(success).toBe(false);
      expect(mockPrisma.rmWebhookOutbox.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'outbox-timeout-1' },
          data: expect.objectContaining({
            status: 'FAILED',
            lastError: expect.stringContaining('timeout'),
          }),
        }),
      );
    });

    it('should handle database error during retry sweep gracefully and release lock', async () => {
      mockPrisma.rmWebhookOutbox.findMany.mockRejectedValue(
        new Error('Neon database transient compute suspend'),
      );

      const result = await service.retryFailedOutbox();

      expect(result.skippedReason).toContain('Neon database transient compute suspend');
      expect(result.retriedCount).toBe(0);
      expect((service as any).isRetrying).toBe(false);
    });
  });
});
