import { Test, TestingModule } from '@nestjs/testing';
import { BusinessTransactionEventService } from '../services/business-transaction-event.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunicationEventBus } from '../../communication/events/communication-event.bus';
import { WorkflowState, AuditEventType } from '../enums/workflow-state.enum';

describe('BusinessTransactionEventService (T1-G, H)', () => {
  let service: BusinessTransactionEventService;
  let mockPrisma: any;
  let mockEventBus: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: 'user-1' }, { id: 'user-2' }]),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-1', title: 'Test Notif' }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockResolvedValue({}),
      },
      indent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'indent-1',
          purpose: 'Test',
          creator: { firstName: 'John', lastName: 'Doe' },
          product: { productName: 'Product A' },
        }),
      },
      costSheet: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    mockEventBus = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessTransactionEventService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CommunicationEventBus, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<BusinessTransactionEventService>(BusinessTransactionEventService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dispatchNotification', () => {
    it('should dispatch notification without blocking and handle success', async () => {
      // Execute the dispatch. Note: it runs background tasks, so we await a small timeout to let promises resolve
      await service.dispatchNotification(
        'indent-1',
        'IND-001',
        WorkflowState.DESIGN_COMPLETED,
        'user-trigger',
      );

      // Wait for background tasks
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockPrisma.user.findMany).toHaveBeenCalled();
      expect(mockPrisma.notification.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.createMany).toHaveBeenCalled(); // delivery logs
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should swallow errors silently in background without crashing caller (T1-H)', async () => {
      // Force an error in the background process
      mockPrisma.user.findMany.mockRejectedValue(new Error('DB Connection Lost'));

      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

      // This should NOT throw
      await expect(
        service.dispatchNotification(
          'indent-1',
          'IND-001',
          WorkflowState.DESIGN_COMPLETED,
          'user-trigger',
        ),
      ).resolves.toBeUndefined();

      // Wait for background promise to reject and logger to be called
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to dispatch notification'),
        expect.any(String),
      );

      loggerSpy.mockRestore();
    });
  });

  describe('dispatchPartialIssueNotification', () => {
    it('should dispatch partial issue notification', async () => {
      await service.dispatchPartialIssueNotification(
        'indent-1',
        'IND-001',
        'Steel',
        1,
        5,
        'user-trigger',
      );

      // Wait for background tasks
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Partial Material Issue: Indent #IND-001',
            message: 'Material "Steel" has been issued. Progress: 1/5 components issued.',
          }),
        }),
      );
    });
  });

  describe('logAudit', () => {
    it('should log audit event asynchronously without throwing (T1-H)', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(new Error('Audit DB Error'));
      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

      // Call it (it's async but doesn't await the DB call directly inside the method)
      // Actually logAudit calls .then().catch() and doesn't return the promise. Wait, logAudit returns Promise<void> but the DB call is fire-and-forget.
      await service.logAudit(AuditEventType.CREATE_DRAFT, 'indent-1', 'user-1', null, null);

      // Wait for fire-and-forget promise
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to record audit log for action'),
        expect.any(String),
      );

      loggerSpy.mockRestore();
    });
  });
});
