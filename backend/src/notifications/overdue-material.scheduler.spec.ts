import { Test, TestingModule } from '@nestjs/testing';
import {
  OverdueMaterialScheduler,
  DEFAULT_OVERDUE_MATERIAL_CRON,
  DEFAULT_APP_TIMEZONE,
  FORTY_EIGHT_HOURS_MS,
  OVERDUE_SCHEDULER_LOCK_KEY,
  OVERDUE_SETTING_KEY,
} from './overdue-material.scheduler';
import { PrismaService } from '../prisma/prisma.service';
import {
  CommunicationEventBus,
  CommunicationEventType,
} from '../communication/events/communication-event.bus';
import { WorkflowState } from '../business-transaction/enums/workflow-state.enum';

describe('OverdueMaterialScheduler', () => {
  let scheduler: OverdueMaterialScheduler;
  let mockPrisma: any;
  let mockEventBus: any;

  const mockAdminUser = {
    id: 'user-admin-1',
    role: { roleName: 'System Administrator' },
    department: null,
  };

  beforeEach(async () => {
    mockPrisma = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      applicationSetting: {
        upsert: jest.fn().mockResolvedValue({ key: OVERDUE_SCHEDULER_LOCK_KEY, value: '0' }),
        findUnique: jest.fn().mockResolvedValue({ key: OVERDUE_SETTING_KEY, value: 'true' }),
        update: jest.fn().mockResolvedValue({ key: OVERDUE_SCHEDULER_LOCK_KEY, value: '0' }),
      },
      indent: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'notif-uuid-1' }),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([mockAdminUser]),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-uuid-1' }),
      },
    };

    mockEventBus = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OverdueMaterialScheduler,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CommunicationEventBus, useValue: mockEventBus },
      ],
    }).compile();

    scheduler = module.get<OverdueMaterialScheduler>(OverdueMaterialScheduler);
  });

  afterEach(() => {
    scheduler.onModuleDestroy();
    jest.clearAllMocks();
  });

  it('should be defined with correct default status and configuration', () => {
    expect(scheduler).toBeDefined();
    const status = scheduler.getSchedulerStatus();
    expect(status.cronSchedule).toBe(DEFAULT_OVERDUE_MATERIAL_CRON);
    expect(status.timezone).toBe(DEFAULT_APP_TIMEZONE);
    expect(status.isProcessing).toBe(false);
  });

  describe('Scenario 1: Indent becoming overdue after existing SLA (> 48 hours)', () => {
    it('should trigger alert and create notification for an indent in stores > 48 hours', async () => {
      const now = Date.now();
      const movedAt = new Date(now - (50 * 60 * 60 * 1000)); // 50 hours ago (> 48h)

      const overdueIndent = {
        id: 'indent-overdue-1',
        indentNumber: 'IND-2026-001',
        currentState: WorkflowState.STORES_PROCESSING,
        createdBy: 'user-creator-1',
        createdAt: movedAt,
        product: { productName: 'Precision Sensor X1' },
        workflowHistory: [{ movedAt }],
        indentItems: [
          {
            id: 'item-1',
            quantity: 100,
            issuedQuantity: 30, // 70 remaining
            isDeleted: false,
            material: { materialName: 'Aluminium Alloy 6061' },
          },
        ],
      };

      mockPrisma.indent.findMany.mockResolvedValue([overdueIndent]);
      mockPrisma.notification.findMany.mockResolvedValue([]); // No existing alert

      const result = await scheduler.handleOverdueMaterialChecks();

      expect(result.processedCount).toBe(1);
      expect(result.alertedCount).toBe(1);

      // Verify Notification creation
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Material Issue Overdue',
            eventType: CommunicationEventType.MATERIAL_ISSUE_OVERDUE,
            referenceId: 'indent-overdue-1',
          }),
        }),
      );

      // Verify Audit Log creation
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            module: 'NOTIFICATIONS',
            recordId: 'notif-uuid-1',
          }),
        }),
      );

      // Verify CommunicationEventBus emission
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        CommunicationEventType.MATERIAL_ISSUE_OVERDUE,
        expect.objectContaining({
          indentId: 'indent-overdue-1',
          indentNumber: 'IND-2026-001',
          totalRemaining: 70,
          outstandingMaterials: [
            {
              materialName: 'Aluminium Alloy 6061',
              requiredQty: 100,
              issuedQty: 30,
              remainingQty: 70,
            },
          ],
        }),
      );
    });
  });

  describe('Scenario 2: Indent not yet overdue (< 48 hours)', () => {
    it('should NOT trigger alert for an indent in stores for only 24 hours', async () => {
      const now = Date.now();
      const movedAt = new Date(now - (24 * 60 * 60 * 1000)); // 24 hours ago (< 48h)

      const recentIndent = {
        id: 'indent-recent-1',
        indentNumber: 'IND-2026-002',
        currentState: WorkflowState.STORES_PROCESSING,
        createdBy: 'user-creator-1',
        createdAt: movedAt,
        product: { productName: 'Control Valve' },
        workflowHistory: [{ movedAt }],
        indentItems: [
          {
            id: 'item-2',
            quantity: 50,
            issuedQuantity: 0,
            isDeleted: false,
            material: { materialName: 'Brass Rod' },
          },
        ],
      };

      mockPrisma.indent.findMany.mockResolvedValue([recentIndent]);

      const result = await scheduler.handleOverdueMaterialChecks();

      expect(result.processedCount).toBe(1);
      expect(result.alertedCount).toBe(0);
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 3: Indent with all materials issued or no remaining quantity', () => {
    it('should NOT trigger alert if all materials have been issued (remainingQty == 0)', async () => {
      const now = Date.now();
      const movedAt = new Date(now - (60 * 60 * 60 * 1000)); // 60 hours ago

      const fullyIssuedIndent = {
        id: 'indent-issued-1',
        indentNumber: 'IND-2026-003',
        currentState: WorkflowState.STORES_PROCESSING,
        createdBy: 'user-creator-1',
        createdAt: movedAt,
        product: { productName: 'Circuit Board' },
        workflowHistory: [{ movedAt }],
        indentItems: [
          {
            id: 'item-3',
            quantity: 50,
            issuedQuantity: 50, // 0 remaining
            isDeleted: false,
            material: { materialName: 'Copper Wire' },
          },
        ],
      };

      mockPrisma.indent.findMany.mockResolvedValue([fullyIssuedIndent]);

      const result = await scheduler.handleOverdueMaterialChecks();

      expect(result.processedCount).toBe(1);
      expect(result.alertedCount).toBe(0);
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 4: Duplicate notification prevention', () => {
    it('should NOT trigger alert if a notification already exists for this indent', async () => {
      const now = Date.now();
      const movedAt = new Date(now - (55 * 60 * 60 * 1000)); // 55 hours ago

      const overdueIndent = {
        id: 'indent-already-alerted',
        indentNumber: 'IND-2026-004',
        currentState: WorkflowState.STORES_PROCESSING,
        createdBy: 'user-creator-1',
        createdAt: movedAt,
        product: { productName: 'Motor Housing' },
        workflowHistory: [{ movedAt }],
        indentItems: [
          {
            id: 'item-4',
            quantity: 10,
            issuedQuantity: 0,
            isDeleted: false,
            material: { materialName: 'Steel Ingot' },
          },
        ],
      };

      mockPrisma.indent.findMany.mockResolvedValue([overdueIndent]);
      // Existing alert found in database
      mockPrisma.notification.findMany.mockResolvedValue([
        { referenceId: 'indent-already-alerted' },
      ]);

      const result = await scheduler.handleOverdueMaterialChecks();

      expect(result.processedCount).toBe(1);
      expect(result.alertedCount).toBe(0);
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 5: Repeated scheduler execution', () => {
    it('should trigger alert on first run and safely skip on immediate second run', async () => {
      const now = Date.now();
      const movedAt = new Date(now - (52 * 60 * 60 * 1000));

      const overdueIndent = {
        id: 'indent-repeat-test',
        indentNumber: 'IND-2026-005',
        currentState: WorkflowState.STORES_PROCESSING,
        createdBy: 'user-creator-1',
        createdAt: movedAt,
        product: { productName: 'Gearbox' },
        workflowHistory: [{ movedAt }],
        indentItems: [
          {
            id: 'item-5',
            quantity: 20,
            issuedQuantity: 5,
            isDeleted: false,
            material: { materialName: 'Titanium Fasteners' },
          },
        ],
      };

      mockPrisma.indent.findMany.mockResolvedValue([overdueIndent]);
      mockPrisma.notification.findMany.mockResolvedValueOnce([]); // First run: no alert

      // Run 1
      const res1 = await scheduler.handleOverdueMaterialChecks();
      expect(res1.alertedCount).toBe(1);
      expect(mockEventBus.emit).toHaveBeenCalledTimes(1);

      // Run 2: Notification now exists in DB
      mockPrisma.notification.findMany.mockResolvedValueOnce([
        { referenceId: 'indent-repeat-test' },
      ]);
      const res2 = await scheduler.handleOverdueMaterialChecks();
      expect(res2.alertedCount).toBe(0);
      // Event bus not called again
      expect(mockEventBus.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Scenario 6: Multiple backend instances concurrency control', () => {
    it('should skip execution if another instance holds the distributed lock', async () => {
      // Simulate another instance holding the lock ($executeRaw returns 0 updated rows)
      mockPrisma.$executeRaw.mockResolvedValue(0);

      const result = await scheduler.handleOverdueMaterialChecks();

      expect(result.skippedReason).toBe('LOCK_HELD_BY_ANOTHER_INSTANCE');
      expect(result.processedCount).toBe(0);
      expect(result.alertedCount).toBe(0);
      expect(mockPrisma.indent.findMany).not.toHaveBeenCalled();
    });

    it('should skip execution if local process is already running a check', async () => {
      // Set private isProcessing to true
      (scheduler as any).isProcessing = true;

      const result = await scheduler.handleOverdueMaterialChecks();

      expect(result.skippedReason).toBe('ALREADY_RUNNING_LOCALLY');
      expect(result.alertedCount).toBe(0);
      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 7: Feature disabled in settings', () => {
    it('should skip checking indents when MATERIAL_ISSUE_OVERDUE_ALERTS_ENABLED is false', async () => {
      mockPrisma.applicationSetting.findUnique.mockResolvedValue({
        key: OVERDUE_SETTING_KEY,
        value: 'false',
      });

      const result = await scheduler.handleOverdueMaterialChecks();

      expect(result.skippedReason).toBe('DISABLED_IN_SETTINGS');
      expect(result.alertedCount).toBe(0);
      expect(mockPrisma.indent.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 8: Database / Neon temporary failure recovery', () => {
    it('should catch database errors gracefully and release the lock', async () => {
      mockPrisma.indent.findMany.mockRejectedValue(
        new Error('Neon database compute scaling connection timeout'),
      );

      const result = await scheduler.handleOverdueMaterialChecks();

      expect(result.skippedReason).toContain('Neon database compute scaling connection timeout');
      expect(result.alertedCount).toBe(0);
      // Ensure lock release was attempted
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      // Ensure local process lock is released
      expect((scheduler as any).isProcessing).toBe(false);
    });
  });

  describe('Scenario 9: Startup recovery check', () => {
    it('should register a startup recovery timer on application bootstrap', () => {
      jest.useFakeTimers();
      const spyCheck = jest.spyOn(scheduler, 'handleOverdueMaterialChecks').mockResolvedValue({
        processedCount: 0,
        alertedCount: 0,
      });

      scheduler.onApplicationBootstrap();
      expect((scheduler as any).startupTimer).toBeDefined();

      // Fast-forward 10 seconds
      jest.advanceTimersByTime(10000);
      expect(spyCheck).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should cancel startup timer cleanly on module destroy', () => {
      jest.useFakeTimers();
      scheduler.onApplicationBootstrap();
      expect((scheduler as any).startupTimer).toBeDefined();

      scheduler.onModuleDestroy();
      expect((scheduler as any).startupTimer).toBeNull();
      jest.useRealTimers();
    });
  });

  describe('Scenario 10: Zero indents in STORES_PROCESSING', () => {
    it('should exit cleanly with zero alerts when stores queue is empty', async () => {
      mockPrisma.indent.findMany.mockResolvedValue([]);

      const result = await scheduler.handleOverdueMaterialChecks();

      expect(result.skippedReason).toBe('NO_INDENTS_IN_STORES');
      expect(result.processedCount).toBe(0);
      expect(result.alertedCount).toBe(0);
      expect(mockPrisma.notification.findMany).not.toHaveBeenCalled();
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });
});
