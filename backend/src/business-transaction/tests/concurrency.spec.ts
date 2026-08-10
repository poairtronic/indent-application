import { Test, TestingModule } from '@nestjs/testing';
import { BusinessTransactionService } from '../services/business-transaction.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessTransactionValidator } from '../validators/business-transaction.validator';
import { WorkflowStateMachineService } from '../services/workflow-state-machine.service';
import { BusinessTransactionEventService } from '../services/business-transaction-event.service';
import { AttachmentStorageService } from '../services/attachment-storage.service';
import { RedisCacheService } from '../../redis-cache/redis-cache.service';

describe('Concurrency & Race Condition Resilience', () => {
  let service: BusinessTransactionService;

  let dbRow = {
    id: 'tx-123',
    currentState: 'DRAFT',
    indentNumber: 'IND-2026-001',
    departmentId: 'dept-123',
    costSheet: { id: 'cs-123' },
    attachments: [],
    indentItems: [],
  };

  const mockPrisma = {
    $transaction: jest.fn(async (callback) => {
      if (Array.isArray(callback)) {
        return Promise.all(callback);
      }
      return callback(mockPrisma);
    }),
    indent: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(dbRow)),
      update: jest.fn().mockImplementation(async (args) => {
        if (args.where.currentState !== dbRow.currentState) {
          throw new Error('Record to update not found.'); // Prisma optimistic lock failure
        }
        dbRow.currentState = args.data.currentState;
        return dbRow;
      }),
      updateMany: jest.fn().mockImplementation(async (args) => {
        if (args.where.currentState !== dbRow.currentState) {
          return { count: 0 }; // Concurrency conflict
        }
        dbRow.currentState = args.data.currentState;
        return { count: 1 };
      }),
    },
    workflowHistory: {
      create: jest.fn().mockResolvedValue({}),
    },
    department: {
      findMany: jest.fn().mockResolvedValue([{ id: 'dept-stores' }]),
      findFirst: jest.fn().mockResolvedValue({ id: 'dept-stores' }),
    },
  };

  const mockValidator = {
    validateTransition: jest.fn().mockReturnValue(true),
  };

  const mockStateMachine = {
    validateTransition: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
    getStageDefinition: jest.fn().mockReturnValue({ targetState: 'DESIGN_COMPLETED', requireAuth: true }),
  };

  const mockEventService = {
    dispatchNotification: jest.fn(),
    logAudit: jest.fn(),
  };

  const mockAttachmentService = {};
  const mockRedisService = {
    invalidatePattern: jest.fn(),
  };

  beforeEach(async () => {
    dbRow.currentState = 'DRAFT';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessTransactionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BusinessTransactionValidator, useValue: mockValidator },
        { provide: WorkflowStateMachineService, useValue: mockStateMachine },
        { provide: BusinessTransactionEventService, useValue: mockEventService },
        { provide: AttachmentStorageService, useValue: mockAttachmentService },
        { provide: RedisCacheService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<BusinessTransactionService>(BusinessTransactionService);
    jest.clearAllMocks();
  });

  it('should allow exactly one transition and reject concurrent overlapping transitions', async () => {
    const requests = [
      service.submitDesign('tx-123', 'user-1', { remarks: 'Req 1', fileUrl: 'url' }),
      service.submitDesign('tx-123', 'user-2', { remarks: 'Req 2', fileUrl: 'url' }),
      service.submitDesign('tx-123', 'user-3', { remarks: 'Req 3', fileUrl: 'url' }),
    ];

    const results = await Promise.allSettled(requests);
    
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    if (fulfilled.length !== 1) {
      console.log('REJECTED:', rejected.map(r => (r as any).reason.message || (r as any).reason));
    }

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(2);
    expect(rejected[0]).toMatchObject({ reason: expect.any(Error) });

    expect(dbRow.currentState).toBe('DESIGN_COMPLETED');
    expect(mockPrisma.workflowHistory.create).toHaveBeenCalledTimes(1);
  });
});
