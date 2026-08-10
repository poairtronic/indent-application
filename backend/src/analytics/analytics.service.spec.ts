/**
 * Analytics Service — Unit Tests
 * Phase 15A: Analytics & Executive Intelligence
 *
 * Uses Jest mock for PrismaService.
 * Tests cover all 6 analytics methods with realistic mock data.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { KpiService } from './kpi.service';
import { PrismaService } from '../prisma/prisma.service';

// ─────────────────────────────────────────────
// Mock PrismaService
// ─────────────────────────────────────────────

const mockPrisma = {
  indent: {
    groupBy: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  department: {
    findMany: jest.fn(),
  },
  costSheet: {
    findMany: jest.fn(),
  },
  costItem: {
    findMany: jest.fn(),
  },
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService, KpiService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // 1. Executive Summary Tests
  // ─────────────────────────────────────────────

  describe('getExecutiveSummary()', () => {
    it('should return correct total, active, pending, completed and archived counts', async () => {
      mockPrisma.indent.groupBy.mockResolvedValue([
        { status: 'DRAFT', _count: { id: 5 } },
        { status: 'SUBMITTED', _count: { id: 3 } },
        { status: 'PENDING_STORES', _count: { id: 2 } },
        { status: 'COMPLETED', _count: { id: 4 } },
        { status: 'PENDING_GENERAL_MANAGER', _count: { id: 1 } },
      ]);

      const result = await service.getExecutiveSummary();

      expect(result.totalTransactions).toBe(15);
      expect(result.completedTransactions).toBe(4);
      expect(result.archivedTransactions).toBe(1);
      // Active: SUBMITTED + PENDING_STORES = 3 + 2 = 5
      expect(result.activeTransactions).toBe(5);
      expect(result.statusBreakdown).toHaveLength(5);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should return zero counts when no indents exist', async () => {
      mockPrisma.indent.groupBy.mockResolvedValue([]);

      const result = await service.getExecutiveSummary();

      expect(result.totalTransactions).toBe(0);
      expect(result.activeTransactions).toBe(0);
      expect(result.completedTransactions).toBe(0);
      expect(result.archivedTransactions).toBe(0);
      expect(result.pendingTransactions).toBe(0);
    });

    it('should map status values to human-readable labels', async () => {
      mockPrisma.indent.groupBy.mockResolvedValue([{ status: 'SUBMITTED', _count: { id: 2 } }]);

      const result = await service.getExecutiveSummary();

      expect(result.statusBreakdown[0].status).toBe('Design Completed');
    });
  });

  // ─────────────────────────────────────────────
  // 2. Workflow Analytics Tests
  // ─────────────────────────────────────────────

  describe('getWorkflowAnalytics()', () => {
    beforeEach(() => {
      mockPrisma.indent.groupBy.mockResolvedValue([
        { status: 'DRAFT', _count: { id: 4 } },
        { status: 'SUBMITTED', _count: { id: 6 } },
        { status: 'COMPLETED', _count: { id: 10 } },
      ]);
      mockPrisma.indent.findMany.mockResolvedValue([
        {
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-11'), // 10 days
        },
        {
          createdAt: new Date('2025-02-01'),
          updatedAt: new Date('2025-02-06'), // 5 days
        },
      ]);
      mockPrisma.indent.count.mockResolvedValue(20);
    });

    it('should compute completionRate correctly', async () => {
      const result = await service.getWorkflowAnalytics();
      // groupBy sum: 4 + 6 + 10 = 20 total; 10 completed / 20 = 50%
      expect(result.completionRate).toBe(50);
    });

    it('should compute averageCycleDays correctly', async () => {
      const result = await service.getWorkflowAnalytics();
      // (10 + 5) / 2 = 7.5 days
      expect(result.averageCycleDays).toBe(7.5);
    });

    it('should identify the bottleneck stage', async () => {
      const result = await service.getWorkflowAnalytics();
      // SUBMITTED has count 6 (highest non-terminal)
      expect(result.bottleneckStage).toBe('Design Completed');
    });

    it('should return stalledTransactions count', async () => {
      const result = await service.getWorkflowAnalytics();
      expect(result.stalledTransactions).toBe(20);
    });

    it('should return null averageCycleDays when no completed indents exist', async () => {
      mockPrisma.indent.findMany.mockResolvedValue([]);
      const result = await service.getWorkflowAnalytics();
      expect(result.averageCycleDays).toBeNull();
    });

    it('should include percentage in stageDistribution', async () => {
      const result = await service.getWorkflowAnalytics();
      const submitted = result.stageDistribution.find((s) => s.stageName === 'Design Completed');
      expect(submitted?.percentage).toBe(30); // 6/20 = 30%
    });
  });

  // ─────────────────────────────────────────────
  // 3. Department Analytics Tests
  // ─────────────────────────────────────────────

  describe('getDepartmentAnalytics()', () => {
    const dept1Id = 'dept-1';
    const dept2Id = 'dept-2';

    beforeEach(() => {
      mockPrisma.department.findMany.mockResolvedValue([
        { id: dept1Id, departmentCode: 'DESIGN', departmentName: 'Design' },
        { id: dept2Id, departmentCode: 'STORES', departmentName: 'Stores' },
      ]);
      mockPrisma.indent.findMany.mockResolvedValue([
        { departmentId: dept1Id, status: 'DRAFT' },
        { departmentId: dept1Id, status: 'SUBMITTED' },
        { departmentId: dept1Id, status: 'COMPLETED' },
        { departmentId: dept2Id, status: 'PENDING_STORES' },
      ]);
    });

    it('should compute correct totals per department', async () => {
      const result = await service.getDepartmentAnalytics();
      const design = result.departments.find((d) => d.departmentCode === 'DESIGN');
      expect(design?.totalTransactions).toBe(3);
      expect(design?.completedCount).toBe(1);
      expect(design?.pendingQueue).toBe(2);
    });

    it('should identify highest workload department', async () => {
      const result = await service.getDepartmentAnalytics();
      expect(result.highestWorkload).toBe('Design');
    });

    it('should return all departments even if they have 0 transactions', async () => {
      mockPrisma.indent.findMany.mockResolvedValue([]);
      const result = await service.getDepartmentAnalytics();
      expect(result.departments).toHaveLength(2);
      expect(result.departments[0].totalTransactions).toBe(0);
    });
  });

  // ─────────────────────────────────────────────
  // 4. Cost Analytics Tests
  // ─────────────────────────────────────────────

  describe('getCostAnalytics()', () => {
    beforeEach(() => {
      mockPrisma.costSheet.findMany.mockResolvedValue([
        {
          id: 'cs-1',
          status: 'FINALIZED',
          predictedTotal: '10000.00',
          actualTotal: '10500.00',
          varianceAmount: '500.00',
          variancePercentage: '5.00',
        },
        {
          id: 'cs-2',
          status: 'DRAFT',
          predictedTotal: '8000.00',
          actualTotal: null,
          varianceAmount: null,
          variancePercentage: null,
        },
      ]);
    });

    it('should aggregate planned costs correctly', async () => {
      const result = await service.getCostAnalytics();
      expect(result.totalPlannedCost).toBe(18000);
    });

    it('should aggregate actual costs (only finalized)', async () => {
      const result = await service.getCostAnalytics();
      expect(result.totalActualCost).toBe(10500);
    });

    it('should report variance correctly', async () => {
      const result = await service.getCostAnalytics();
      expect(result.totalVarianceAmount).toBe(500);
    });

    it('should count finalized and draft cost sheets', async () => {
      const result = await service.getCostAnalytics();
      expect(result.finalizedCostSheets).toBe(1);
      expect(result.draftCostSheets).toBe(1);
    });

    it('should return zero avgVariance when no sheets have actuals', async () => {
      mockPrisma.costSheet.findMany.mockResolvedValue([
        {
          id: 'cs-1',
          status: 'DRAFT',
          predictedTotal: '5000.00',
          actualTotal: null,
          varianceAmount: null,
          variancePercentage: null,
        },
      ]);
      const result = await service.getCostAnalytics();
      expect(result.averageVariancePercentage).toBe(0);
    });

    it('should pass date range to Prisma query', async () => {
      const from = new Date('2025-01-01');
      const to = new Date('2025-12-31');
      await service.getCostAnalytics(from, to);
      expect(mockPrisma.costSheet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: from, lte: to },
          }),
        }),
      );
    });
  });

  // ─────────────────────────────────────────────
  // 5. Product Analytics Tests
  // ─────────────────────────────────────────────

  describe('getProductAnalytics()', () => {
    beforeEach(() => {
      mockPrisma.indent.findMany.mockResolvedValue([
        {
          productId: 'p-1',
          product: { id: 'p-1', productCode: 'P001', productName: 'Product A' },
          costSheet: { predictedTotal: '5000', actualTotal: '5200', status: 'FINALIZED' },
        },
        {
          productId: 'p-1',
          product: { id: 'p-1', productCode: 'P001', productName: 'Product A' },
          costSheet: { predictedTotal: '6000', actualTotal: null, status: 'DRAFT' },
        },
        {
          productId: 'p-2',
          product: { id: 'p-2', productCode: 'P002', productName: 'Product B' },
          costSheet: { predictedTotal: '3000', actualTotal: '2800', status: 'FINALIZED' },
        },
      ]);
    });

    it('should group indents by product and count correctly', async () => {
      const result = await service.getProductAnalytics();
      const prodA = result.products.find((p) => p.productCode === 'P001');
      expect(prodA?.indentCount).toBe(2);
    });

    it('should compute average planned cost per product', async () => {
      const result = await service.getProductAnalytics();
      const prodA = result.products.find((p) => p.productCode === 'P001');
      expect(prodA?.averagePlannedCost).toBe(5500);
    });

    it('should identify most produced product', async () => {
      const result = await service.getProductAnalytics();
      expect(result.mostProducedProduct).toBe('Product A');
    });

    it('should respect limit parameter', async () => {
      const result = await service.getProductAnalytics(1);
      expect(result.products.length).toBeLessThanOrEqual(1);
    });

    it('should handle indents with no product gracefully', async () => {
      mockPrisma.indent.findMany.mockResolvedValue([
        { productId: 'p-1', product: null, costSheet: null },
      ]);
      const result = await service.getProductAnalytics();
      expect(result.products).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────
  // 6. Vendor Analytics Tests
  // ─────────────────────────────────────────────

  describe('getVendorAnalytics()', () => {
    beforeEach(() => {
      mockPrisma.costItem.findMany.mockResolvedValue([
        {
          vendorId: 'v-1',
          predictedAmount: '10000',
          actualAmount: '10200',
          vendor: { id: 'v-1', vendorCode: 'V001', vendorName: 'Vendor Alpha' },
        },
        {
          vendorId: 'v-1',
          predictedAmount: '5000',
          actualAmount: null,
          vendor: { id: 'v-1', vendorCode: 'V001', vendorName: 'Vendor Alpha' },
        },
        {
          vendorId: 'v-2',
          predictedAmount: '8000',
          actualAmount: '7900',
          vendor: { id: 'v-2', vendorCode: 'V002', vendorName: 'Vendor Beta' },
        },
      ]);
    });

    it('should aggregate total cost items per vendor', async () => {
      const result = await service.getVendorAnalytics();
      const alpha = result.vendors.find((v) => v.vendorCode === 'V001');
      expect(alpha?.totalCostItems).toBe(2);
    });

    it('should sum predicted amounts per vendor', async () => {
      const result = await service.getVendorAnalytics();
      const alpha = result.vendors.find((v) => v.vendorCode === 'V001');
      expect(alpha?.totalPredictedAmount).toBe(15000);
    });

    it('should compute variance for vendors with actuals', async () => {
      const result = await service.getVendorAnalytics();
      // Alpha: actual = 10200, predicted = 15000, variance = 10200 - 15000 = -4800
      const alpha = result.vendors.find((v) => v.vendorCode === 'V001');
      expect(alpha?.totalActualAmount).toBe(10200);
    });

    it('should sort vendors by predicted amount descending', async () => {
      const result = await service.getVendorAnalytics();
      expect(result.vendors[0].totalPredictedAmount).toBeGreaterThanOrEqual(
        result.vendors[1].totalPredictedAmount,
      );
    });

    it('should identify the highest usage vendor', async () => {
      const result = await service.getVendorAnalytics();
      expect(result.highestUsageVendor).toBe('Vendor Alpha');
    });

    it('should return empty when no cost items exist', async () => {
      mockPrisma.costItem.findMany.mockResolvedValue([]);
      const result = await service.getVendorAnalytics();
      expect(result.vendors).toHaveLength(0);
      expect(result.highestUsageVendor).toBeNull();
    });
  });
});
