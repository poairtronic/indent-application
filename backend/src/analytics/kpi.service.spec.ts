import { Test, TestingModule } from '@nestjs/testing';
import { KpiService } from './kpi.service';
import { PrismaService } from '../prisma/prisma.service';

describe('KpiService (SQL-side groupBy refactor)', () => {
  let service: KpiService;
  let mockPrisma: any;

  // createdAt-window counts: DRAFT:2, SUBMITTED:3, PENDING_STORES:1, IN_PRODUCTION:4,
  // PENDING_ACCOUNTS:1, PENDING_GENERAL_MANAGER:1, COMPLETED:2 (total 14)
  const currentCreatedAt = [
    { status: 'DRAFT', _count: { id: 2 } },
    { status: 'SUBMITTED', _count: { id: 3 } },
    { status: 'PENDING_STORES', _count: { id: 1 } },
    { status: 'IN_PRODUCTION', _count: { id: 4 } },
    { status: 'PENDING_ACCOUNTS', _count: { id: 1 } },
    { status: 'PENDING_GENERAL_MANAGER', _count: { id: 1 } },
    { status: 'COMPLETED', _count: { id: 2 } },
  ];
  const prevCreatedAt = [
    { status: 'DRAFT', _count: { id: 1 } },
    { status: 'SUBMITTED', _count: { id: 1 } },
    { status: 'IN_PRODUCTION', _count: { id: 1 } },
    { status: 'COMPLETED', _count: { id: 3 } },
  ];
  const currentUpdatedAt = [{ status: 'COMPLETED', _count: { id: 5 } }];
  const prevUpdatedAt = [{ status: 'COMPLETED', _count: { id: 4 } }];

  const zeroSum = {
    _sum: { predictedTotal: 0, actualTotal: 0, varianceAmount: 0 },
    _avg: { predictedTotal: 0, actualTotal: 0 },
  };

  const adminUser = {
    email: 'admin@imcms.com',
    departmentId: 'dept-gm',
    department: { departmentCode: 'GMGR' },
    permissions: ['settings.manage'],
  };

  beforeEach(async () => {
    mockPrisma = {
      indent: {
        groupBy: jest.fn().mockImplementation((args: any) => {
          if (args.where.updatedAt) {
            return args.where.updatedAt.gte instanceof Date &&
              args.where.updatedAt.gte < new Date('2026-01-01')
              ? prevUpdatedAt
              : currentUpdatedAt;
          }
          return args.where.createdAt.gte instanceof Date &&
            args.where.createdAt.gte < new Date('2026-01-01')
            ? prevCreatedAt
            : currentCreatedAt;
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      costSheet: { aggregate: jest.fn().mockResolvedValue(zeroSum) },
      costItem: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { actualAmount: 0, predictedAmount: 0 },
        }),
      },
      processCost: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { actualCost: 0, predictedCost: 0 } }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [KpiService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<KpiService>(KpiService);
  });

  const findKpi = (kpis: any[], id: string) => kpis.find((k) => k.id === id);

  it('derives every KPI from SQL groupBy maps with identical values', async () => {
    const kpis = await service.getKpis(adminUser, {
      dateFrom: '2026-01-01',
      dateTo: '2026-08-19',
    });

    expect(findKpi(kpis, 'total-indents').value).toBe(14);
    expect(findKpi(kpis, 'total-indents').trendPercentage).toBe(133.3);
    expect(findKpi(kpis, 'active-indents').value).toBe(9); // 3+1+4+1
    expect(findKpi(kpis, 'active-indents').trendPercentage).toBe(350); // (9-2)/2*100
    expect(findKpi(kpis, 'completed-indents').value).toBe(5); // updatedAt window
    expect(findKpi(kpis, 'completed-indents').trendPercentage).toBe(25); // (5-4)/4*100
    expect(findKpi(kpis, 'production-in-progress').value).toBe(4);
    expect(findKpi(kpis, 'production-in-progress').trendPercentage).toBe(300); // (4-1)/1*100

    expect(findKpi(kpis, 'draft-transactions').value).toBe(2);
    expect(findKpi(kpis, 'draft-transactions').trendPercentage).toBe(100); // (2-1)/1*100
    expect(findKpi(kpis, 'design-pending').value).toBe(3);
    expect(findKpi(kpis, 'stores-pending').value).toBe(1);
    expect(findKpi(kpis, 'production-pending').value).toBe(4);
    expect(findKpi(kpis, 'accounts-pending').value).toBe(1);
    expect(findKpi(kpis, 'archived-transactions').value).toBe(1);
  });

  it('preserves the original trend / percentage rounding semantics', async () => {
    const kpis = await service.getKpis(adminUser, {
      dateFrom: '2026-01-01',
      dateTo: '2026-08-19',
    });

    const total = findKpi(kpis, 'total-indents');
    // (14 - 6) / 6 * 100 = 133.333 -> rounded to 1 decimal
    expect(total.trend).toBe('up');
    expect(total.trendPercentage).toBe(133.3);
    expect(total.value).toBe(14);
  });

  it('keeps the status-filter override semantics: totals honour it, active/completed do not', async () => {
    const kpis = await service.getKpis(adminUser, {
      dateFrom: '2026-01-01',
      dateTo: '2026-08-19',
      status: 'DRAFT',
    });

    expect(findKpi(kpis, 'total-indents').value).toBe(2); // only DRAFT
    // Original behaviour: active/completed/in-production ignored the status filter
    expect(findKpi(kpis, 'active-indents').value).toBe(9);
    expect(findKpi(kpis, 'completed-indents').value).toBe(5);
    expect(findKpi(kpis, 'production-in-progress').value).toBe(4);
  });

  it('issues 4 groupBy queries and never passes the status filter to the count SQL', async () => {
    await service.getKpis(adminUser, {
      dateFrom: '2026-01-01',
      dateTo: '2026-08-19',
      status: 'DRAFT',
    });

    expect(mockPrisma.indent.groupBy).toHaveBeenCalledTimes(4);
    for (const call of mockPrisma.indent.groupBy.mock.calls) {
      expect(call[0].where.status).toBeUndefined();
      expect(call[0].by).toEqual(['status']);
    }
    expect(mockPrisma.indent.count).toBeUndefined();
  });
});
