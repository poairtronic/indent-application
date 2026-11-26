import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { ObservabilityController } from './observability.controller';
import { ObservabilityService } from './observability.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ObservabilityController (Health Checks & Readiness)', () => {
  let controller: ObservabilityController;
  let service: ObservabilityService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObservabilityController],
      providers: [
        ObservabilityService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    controller = module.get<ObservabilityController>(ObservabilityController);
    service = module.get<ObservabilityService>(ObservabilityService);
    service.resetReadinessCache();
  });

  afterEach(() => {
    service.resetReadinessCache();
    jest.clearAllMocks();
  });

  describe('Liveness Probe (GET /api/observability/health/liveness)', () => {
    it('Scenario 1: should return UP status when database is available', () => {
      const result = controller.getLiveness();
      expect(result).toBeDefined();
      expect(result.status).toBe('UP');
      expect(result.timestamp).toBeDefined();
    });

    it('Scenario 2: should return UP status even when database is down/unavailable', () => {
      // Simulate database error on Prisma
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      const result = controller.getLiveness();
      expect(result.status).toBe('UP');
    });

    it('Scenario 3: must execute ZERO database queries or Prisma calls', () => {
      controller.getLiveness();
      controller.getLiveness();
      controller.getLiveness();

      // Verify Prisma was never accessed
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('Readiness Probe (GET /api/observability/health/readiness)', () => {
    it('Scenario 4: should return UP when database probe succeeds', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const result = await controller.getReadiness();

      expect(result.status).toBe('UP');
      expect(result.services.database).toBe('UP');
      expect(result.services.queue).toBe('UP');
      expect(result.timestamp).toBeDefined();
      // Only 1 consolidated query executed (not 2)
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('Scenario 5: should throw 503 ServiceUnavailableException when database is down', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Neon compute connection timeout'));

      await expect(controller.getReadiness('true')).rejects.toThrow(
        ServiceUnavailableException,
      );

      try {
        await controller.getReadiness('true');
      } catch (err: any) {
        expect(err.getStatus()).toBe(503);
        const response = err.getResponse();
        expect(response.status).toBe('DOWN');
        expect(response.services.database).toBe('DOWN');
        expect(response.services.queue).toBe('DOWN');
      }
    });

    it('Scenario 6: should reuse cached readiness status within TTL and execute ZERO additional SQL', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      // Call 1: live check executes 1 query
      const res1 = await controller.getReadiness();
      expect(res1.status).toBe('UP');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);

      // Call 2: within TTL, reuses cache with 0 SQL
      const res2 = await controller.getReadiness();
      expect(res2.status).toBe('UP');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);

      // Call 3: within TTL, reuses cache with 0 SQL
      const res3 = await controller.getReadiness();
      expect(res3.status).toBe('UP');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('Scenario 7: should re-verify database after cache TTL expires', async () => {
      jest.useFakeTimers();
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      // Initial check
      await controller.getReadiness();
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);

      // Advance clock past 30s TTL
      jest.advanceTimersByTime(31000);

      // Should re-probe database
      await controller.getReadiness();
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('Scenario 8: should bypass cache when force=true', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      // Call 1
      await controller.getReadiness();
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);

      // Call 2 with force=true
      await controller.getReadiness('true');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);

      // Call 3 with force=1
      await controller.getReadiness('1');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(3);
    });

    it('Scenario 9: should reuse recent real database traffic without executing probe query', async () => {
      // Simulate that a real business query succeeded 5 seconds ago
      (service as any).lastSuccessfulDbQueryTime = Date.now() - 5000;

      // Readiness should immediately know database is UP without running SELECT 1
      const result = await controller.getReadiness();

      expect(result.status).toBe('UP');
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('Frontend Error Telemetry & Metrics', () => {
    it('should sanitize and record frontend errors', () => {
      const res = controller.recordFrontendError({
        type: 'TypeError',
        message: 'find is not a function',
        stack: 'at N (...)',
        url: 'https://example.com/indents',
        timestamp: new Date().toISOString(),
      });
      expect(res.success).toBe(true);
    });

    it('should return compiled system metrics', () => {
      const metrics = controller.getMetrics();
      expect(metrics.success).toBe(true);
      expect(metrics.data.systemHealth).toBeDefined();
      expect(metrics.data.apiMetrics).toBeDefined();
      expect(metrics.data.databaseMetrics).toBeDefined();
    });
  });
});
