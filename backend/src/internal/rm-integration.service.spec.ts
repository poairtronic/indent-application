import { Test, TestingModule } from '@nestjs/testing';
import { RmIntegrationService } from './rm-integration.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RmIntegrationService', () => {
  let service: RmIntegrationService;
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    process.env = { ...originalEnv };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RmIntegrationService,
        {
          provide: PrismaService,
          useValue: {},
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

  it('should skip gracefully if RM_API_URL or RM_INTERNAL_SECRET is missing', async () => {
    delete process.env.RM_API_URL;
    delete process.env.RM_INTERNAL_SECRET;

    const mockPrisma: any = {
      indent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'indent-1',
          indentNumber: 'IND-001',
          indentItems: [],
          broughtMaterials: [],
        }),
      },
    };

    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    await expect(service.notifyStoresPending('indent-1', mockPrisma)).resolves.not.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should skip gracefully if indent is not found', async () => {
    process.env.RM_API_URL = 'http://localhost:4000';
    process.env.RM_INTERNAL_SECRET = 'test-secret';

    const mockPrisma: any = {
      indent: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    await expect(
      service.notifyStoresPending('indent-nonexistent', mockPrisma),
    ).resolves.not.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should format line items and send webhook to RM', async () => {
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

    const mockPrisma: any = {
      indent: {
        findUnique: jest.fn().mockResolvedValue(mockIndent),
      },
    };

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('{"success":true}'),
      json: jest.fn().mockResolvedValue({ success: true }),
    });
    global.fetch = fetchMock;

    await service.notifyStoresPending('indent-uuid-1', mockPrisma);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/api/internal/merc/indent-pending',
      {
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
      },
    );
  });

  it('should handle fetch non-OK responses without throwing', async () => {
    process.env.RM_API_URL = 'http://localhost:4000';
    process.env.RM_INTERNAL_SECRET = 'rm-secret-123';

    const mockIndent = {
      id: 'indent-uuid-1',
      indentNumber: 'IND-2026-001',
      indentItems: [],
      broughtMaterials: [],
    };

    const mockPrisma: any = {
      indent: {
        findUnique: jest.fn().mockResolvedValue(mockIndent),
      },
    };

    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('Internal error on RM'),
    });
    global.fetch = fetchMock;

    await expect(service.notifyStoresPending('indent-uuid-1', mockPrisma)).resolves.not.toThrow();
  });

  it('should handle fetch network errors without throwing', async () => {
    process.env.RM_API_URL = 'http://localhost:4000';
    process.env.RM_INTERNAL_SECRET = 'rm-secret-123';

    const mockIndent = {
      id: 'indent-uuid-1',
      indentNumber: 'IND-2026-001',
      indentItems: [],
      broughtMaterials: [],
    };

    const mockPrisma: any = {
      indent: {
        findUnique: jest.fn().mockResolvedValue(mockIndent),
      },
    };

    const fetchMock = jest.fn().mockRejectedValue(new Error('Connection refused'));
    global.fetch = fetchMock;

    await expect(service.notifyStoresPending('indent-uuid-1', mockPrisma)).resolves.not.toThrow();
  });
});
