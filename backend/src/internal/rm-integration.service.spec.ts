import { Test, TestingModule } from '@nestjs/testing';
import { RmIntegrationService } from './rm-integration.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RmIntegrationService', () => {
  let service: RmIntegrationService;
  let mockPrisma: any;
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    process.env = { ...originalEnv };

    mockPrisma = {
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

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      indentItems: [
        {
          id: 'item-raw-1',
          quantity: 10,
          shape: 'ROUND',
          lengthMm: 150,
          widthMm: null,
          heightMm: null,
          diameterMm: 25,
          material: {
            materialName: 'Aluminium 6061',
          },
          unit: {
            unitName: 'Nos',
          },
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
      text: jest.fn().mockResolvedValue('{"success":true}'),
      json: jest.fn().mockResolvedValue({ success: true }),
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
        body: JSON.stringify({
          indentId: 'indent-uuid-1',
          indentNumber: 'IND-2026-001',
          poNumber: null,
          customerName: 'Acme Corp',
          layoutNumber: 'LAY-100',
          mercCurrentState: 'STORES_PROCESSING',
          lineItems: [
            {
              mercItemId: 'item-raw-1',
              itemType: 'RAW_MATERIAL',
              name: 'Aluminium 6061',
              material: 'Aluminium 6061',
              shape: 'ROUND',
              lengthMm: 150,
              widthMm: null,
              heightMm: null,
              diameterMm: 25,
              quantityRequired: 10,
              unit: 'Nos',
            },
            {
              mercItemId: 'item-bo-1',
              itemType: 'BROUGHT_OUT',
              name: 'Bearing 6204',
              material: null,
              shape: null,
              lengthMm: null,
              widthMm: null,
              heightMm: null,
              diameterMm: null,
              quantityRequired: 4,
              unit: null,
            },
          ],
        }),
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
    const retrySpy = jest.spyOn(service, 'retryFailedOutbox').mockResolvedValue(undefined);
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
});
