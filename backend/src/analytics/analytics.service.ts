/**
 * Analytics Service — Phase 15A: Analytics & Executive Intelligence
 *
 * READ-ONLY service. No mutations. No schema changes.
 * All data derived exclusively from existing Prisma models.
 * Architecture: Fat Service pattern (mirrors BusinessTransactionService).
 */

import { Injectable, Logger } from '@nestjs/common';
import { IndentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { KpiService } from './kpi.service';
import { KpiQueryDto } from './dto/kpi-query.dto';
import { WorkflowStateMapper } from '../business-transaction/mappers/workflow-state.mapper';
import {
  IExecutiveSummary,
  ITransactionStatusBreakdown,
  IWorkflowAnalytics,
  IStageDistribution,
  IDepartmentAnalytics,
  IDepartmentWorkload,
  ICostAnalytics,
  IProductAnalytics,
  IProductStat,
  IVendorAnalytics,
  IVendorStat,
  IInsight,
  IInsightsSummary,
} from './interfaces/analytics.interfaces';

/**
 * Maps Prisma IndentStatus values to human-readable workflow stage names.
 * Mirrors the Two-Loop Zero-Approval workflow architecture.
 */
const STATUS_LABEL_MAP: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Design Completed',
  PENDING_STORES: 'Stores Processing',
  IN_PRODUCTION: 'Production Processing',
  APPROVED: 'Customer Delivered',
  PENDING_ACCOUNTS: 'Accounts Cost Verification',
  PENDING_SENIOR_MANAGER: 'Accounts Financial Closure',
  PENDING_GENERAL_MANAGER: 'Archived',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

/**
 * Statuses considered "active" (currently progressing through a workflow stage)
 */
const ACTIVE_STATUSES: IndentStatus[] = [
  IndentStatus.SUBMITTED,
  IndentStatus.PENDING_STORES,
  IndentStatus.IN_PRODUCTION,
  IndentStatus.APPROVED,
  IndentStatus.PENDING_ACCOUNTS,
  IndentStatus.PENDING_SENIOR_MANAGER,
];

/**
 * Statuses considered "pending" (not yet completed or archived)
 */
const PENDING_STATUSES: IndentStatus[] = [
  IndentStatus.DRAFT,
  IndentStatus.SUBMITTED,
  IndentStatus.PENDING_STORES,
  IndentStatus.IN_PRODUCTION,
  IndentStatus.APPROVED,
  IndentStatus.PENDING_ACCOUNTS,
  IndentStatus.PENDING_SENIOR_MANAGER,
];

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kpiService: KpiService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // 1. EXECUTIVE SUMMARY
  // GET /analytics/summary
  // ──────────────────────────────────────────────────────────────

  /**
   * Returns a high-level executive summary of all Business Transactions.
   * Aggregates transaction counts by workflow status.
   */
  public async getExecutiveSummary(): Promise<IExecutiveSummary> {
    this.logger.log('Computing executive summary analytics');

    // Fetch all non-deleted indents (group by status using count)
    const grouped = await this.prisma.indent.groupBy({
      by: ['status'],
      where: { isDeleted: false },
      _count: { id: true },
    });

    const statusMap = new Map<string, number>();
    let total = 0;

    grouped.forEach((row) => {
      const count = row._count.id;
      statusMap.set(row.status, count);
      total += count;
    });

    const active = ACTIVE_STATUSES.reduce((sum, s) => sum + (statusMap.get(s) ?? 0), 0);
    const pending = PENDING_STATUSES.reduce((sum, s) => sum + (statusMap.get(s) ?? 0), 0);
    const completed = statusMap.get(IndentStatus.COMPLETED) ?? 0;
    const archived = statusMap.get(IndentStatus.PENDING_GENERAL_MANAGER) ?? 0;

    const statusBreakdown: ITransactionStatusBreakdown[] = grouped.map((row) => ({
      status: STATUS_LABEL_MAP[row.status] ?? row.status,
      count: row._count.id,
    }));

    return {
      totalTransactions: total,
      activeTransactions: active,
      completedTransactions: completed,
      archivedTransactions: archived,
      pendingTransactions: pending,
      statusBreakdown,
      generatedAt: new Date(),
    };
  }

  // ──────────────────────────────────────────────────────────────
  // 2. WORKFLOW ANALYTICS
  // GET /analytics/workflow
  // ──────────────────────────────────────────────────────────────

  /**
   * Returns workflow distribution analytics:
   * stage breakdown, completion rate, average cycle days, bottlenecks.
   */
  public async getWorkflowAnalytics(): Promise<IWorkflowAnalytics> {
    this.logger.log('Computing workflow analytics');

    const [allIndents, completedIndents, total, stalledCount] = await Promise.all([
      // Fetch all non-deleted indents to compute domain-state-level distribution.
      // This is necessary because multiple domain WorkflowStates map to the same
      // Prisma IndentStatus (e.g. STORES_PROCESSING and MATERIALS_ISSUED both map
      // to PENDING_STORES), so groupBy('status') would merge distinct workflow stages.
      this.prisma.indent.findMany({
        where: { isDeleted: false },
        select: { status: true, remarks: true },
      }),
      // Completed indents with timestamps for cycle time calculation
      this.prisma.indent.findMany({
        where: { isDeleted: false, status: IndentStatus.COMPLETED },
        select: { createdAt: true, updatedAt: true },
      }),
      // Total non-deleted
      this.prisma.indent.count({ where: { isDeleted: false } }),
      // Stalled: pending for more than 7 days in same state
      this.prisma.indent.count({
        where: {
          isDeleted: false,
          status: { in: ACTIVE_STATUSES },
          updatedAt: {
            lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Group by domain WorkflowState using the mapper (remarks-based disambiguation)
    const domainStateCounts = new Map<string, number>();
    for (const indent of allIndents) {
      const domainState = WorkflowStateMapper.toDomain(indent.status, indent);
      domainStateCounts.set(domainState, (domainStateCounts.get(domainState) ?? 0) + 1);
    }

    // Stage distribution with percentages — one entry per domain WorkflowState
    const stageDistribution: IStageDistribution[] = Array.from(domainStateCounts.entries()).map(
      ([stateKey, count]) => ({
        stageName: stateKey,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }),
    );

    // Completion rate
    const completedCount = domainStateCounts.get('COMPLETED') ?? 0;
    const completionRate = total > 0 ? Math.round((completedCount / total) * 10000) / 100 : 0;

    // Average cycle time (createdAt → updatedAt for COMPLETED)
    let averageCycleDays: number | null = null;
    if (completedIndents.length > 0) {
      const totalDays = completedIndents.reduce((sum, indent) => {
        const diff = indent.updatedAt.getTime() - indent.createdAt.getTime();
        return sum + diff / (1000 * 60 * 60 * 24);
      }, 0);
      averageCycleDays = Math.round((totalDays / completedIndents.length) * 100) / 100;
    }

    // Bottleneck: domain state with highest count (excluding COMPLETED)
    let bottleneckStage: string | null = null;
    let maxCount = 0;
    for (const [stateKey, count] of domainStateCounts) {
      if (stateKey !== 'COMPLETED' && count > maxCount) {
        maxCount = count;
        bottleneckStage = stateKey;
      }
    }

    return {
      stageDistribution,
      completionRate,
      averageCycleDays,
      bottleneckStage,
      stalledTransactions: stalledCount,
      generatedAt: new Date(),
    };
  }

  // ──────────────────────────────────────────────────────────────
  // 3. DEPARTMENT ANALYTICS
  // GET /analytics/departments
  // ──────────────────────────────────────────────────────────────

  /**
   * Returns workload analytics per department.
   * Shows total, pending, and completed transaction counts per department.
   */
  public async getDepartmentAnalytics(): Promise<IDepartmentAnalytics> {
    this.logger.log('Computing department analytics');

    const [departments, indents] = await Promise.all([
      this.prisma.department.findMany({
        where: { isDeleted: false, status: 'ACTIVE' },
        select: { id: true, departmentCode: true, departmentName: true },
      }),
      this.prisma.indent.findMany({
        where: { isDeleted: false },
        select: { departmentId: true, status: true },
      }),
    ]);

    // Build department stat map
    const deptMap = new Map<string, { total: number; pending: number; completed: number }>();

    departments.forEach((dept) => {
      deptMap.set(dept.id, { total: 0, pending: 0, completed: 0 });
    });

    indents.forEach((indent) => {
      const stats = deptMap.get(indent.departmentId);
      if (!stats) return;
      stats.total++;
      if (indent.status === IndentStatus.COMPLETED) {
        stats.completed++;
      } else if (PENDING_STATUSES.includes(indent.status as IndentStatus)) {
        stats.pending++;
      }
    });

    const departmentWorkloads: IDepartmentWorkload[] = departments.map((dept) => {
      const stats = deptMap.get(dept.id) ?? { total: 0, pending: 0, completed: 0 };
      return {
        departmentId: dept.id,
        departmentCode: dept.departmentCode,
        departmentName: dept.departmentName,
        totalTransactions: stats.total,
        pendingQueue: stats.pending,
        completedCount: stats.completed,
      };
    });

    // Highest workload: most pending
    const highestWorkload = departmentWorkloads.reduce(
      (max, dept) => (dept.pendingQueue > (max?.pendingQueue ?? -1) ? dept : max),
      departmentWorkloads[0] ?? null,
    );

    return {
      departments: departmentWorkloads,
      highestWorkload: highestWorkload?.departmentName ?? null,
      generatedAt: new Date(),
    };
  }

  // ──────────────────────────────────────────────────────────────
  // 4. COST ANALYTICS
  // GET /analytics/costs
  // ──────────────────────────────────────────────────────────────

  /**
   * Returns aggregated cost analytics across all cost sheets.
   * Supports optional date range filter.
   */
  public async getCostAnalytics(from?: Date, to?: Date): Promise<ICostAnalytics> {
    this.logger.log('Computing cost analytics');

    const dateFilter = this.buildDateFilter(from, to);

    const costSheets = await this.prisma.costSheet.findMany({
      where: {
        isDeleted: false,
        ...dateFilter,
      },
      select: {
        id: true,
        status: true,
        predictedTotal: true,
        actualTotal: true,
        varianceAmount: true,
        variancePercentage: true,
      },
    });

    let totalPlanned = 0;
    let totalActual = 0;
    let totalVariance = 0;
    let variancePercentageSum = 0;
    let sheetsWithActuals = 0;
    let finalizedCount = 0;
    let draftCount = 0;

    for (const sheet of costSheets) {
      totalPlanned += Number(sheet.predictedTotal ?? 0);

      if (sheet.actualTotal !== null) {
        totalActual += Number(sheet.actualTotal);
        sheetsWithActuals++;
      }
      if (sheet.varianceAmount !== null) {
        totalVariance += Number(sheet.varianceAmount);
      }
      if (sheet.variancePercentage !== null) {
        variancePercentageSum += Number(sheet.variancePercentage);
      }
      if (sheet.status === 'FINALIZED') {
        finalizedCount++;
      } else if (sheet.status === 'DRAFT') {
        draftCount++;
      }
    }

    const averageVariancePercentage =
      sheetsWithActuals > 0
        ? Math.round((variancePercentageSum / sheetsWithActuals) * 100) / 100
        : 0;

    return {
      totalPlannedCost: Math.round(totalPlanned * 100) / 100,
      totalActualCost: Math.round(totalActual * 100) / 100,
      totalVarianceAmount: Math.round(totalVariance * 100) / 100,
      averageVariancePercentage,
      costSheetsWithActuals: sheetsWithActuals,
      finalizedCostSheets: finalizedCount,
      draftCostSheets: draftCount,
      dateRange: { from: from ?? null, to: to ?? null },
      generatedAt: new Date(),
    };
  }

  // ──────────────────────────────────────────────────────────────
  // 5. PRODUCT ANALYTICS
  // GET /analytics/products
  // ──────────────────────────────────────────────────────────────

  /**
   * Returns product-level analytics: indent count, average cost per product.
   */
  public async getProductAnalytics(limit = 50): Promise<IProductAnalytics> {
    this.logger.log('Computing product analytics');

    const indents = await this.prisma.indent.findMany({
      where: { isDeleted: false },
      select: {
        productId: true,
        product: {
          select: {
            id: true,
            productCode: true,
            productName: true,
          },
        },
        costSheet: {
          select: {
            predictedTotal: true,
            actualTotal: true,
            status: true,
          },
        },
      },
    });

    // Aggregate per product
    const productMap = new Map<
      string,
      {
        productCode: string;
        productName: string;
        indentCount: number;
        plannedCosts: number[];
        actualCosts: number[];
      }
    >();

    for (const indent of indents) {
      if (!indent.product) continue;
      const pid = indent.productId;

      if (!productMap.has(pid)) {
        productMap.set(pid, {
          productCode: indent.product.productCode,
          productName: indent.product.productName,
          indentCount: 0,
          plannedCosts: [],
          actualCosts: [],
        });
      }

      const stats = productMap.get(pid)!;
      stats.indentCount++;

      if (indent.costSheet) {
        if (indent.costSheet.predictedTotal !== null) {
          stats.plannedCosts.push(Number(indent.costSheet.predictedTotal));
        }
        if (indent.costSheet.actualTotal !== null) {
          stats.actualCosts.push(Number(indent.costSheet.actualTotal));
        }
      }
    }

    // Build output, sorted by indentCount desc, limited
    const products: IProductStat[] = [...productMap.entries()]
      .map(([productId, stats]) => {
        const avgPlanned =
          stats.plannedCosts.length > 0
            ? stats.plannedCosts.reduce((a, b) => a + b, 0) / stats.plannedCosts.length
            : 0;
        const avgActual =
          stats.actualCosts.length > 0
            ? stats.actualCosts.reduce((a, b) => a + b, 0) / stats.actualCosts.length
            : null;
        const highestPlanned = stats.plannedCosts.length > 0 ? Math.max(...stats.plannedCosts) : 0;
        const lowestPlanned = stats.plannedCosts.length > 0 ? Math.min(...stats.plannedCosts) : 0;

        return {
          productId,
          productCode: stats.productCode,
          productName: stats.productName,
          indentCount: stats.indentCount,
          averagePlannedCost: Math.round(avgPlanned * 100) / 100,
          averageActualCost: avgActual !== null ? Math.round(avgActual * 100) / 100 : null,
          highestPlannedCost: Math.round(highestPlanned * 100) / 100,
          lowestPlannedCost: Math.round(lowestPlanned * 100) / 100,
        };
      })
      .sort((a, b) => b.indentCount - a.indentCount)
      .slice(0, limit);

    const mostProduced = products[0]?.productName ?? null;
    const highestCost =
      products.length > 0
        ? [...products].sort((a, b) => b.averagePlannedCost - a.averagePlannedCost)[0].productName
        : null;
    const lowestCost =
      products.length > 0
        ? [...products].sort((a, b) => a.averagePlannedCost - b.averagePlannedCost)[0].productName
        : null;

    return {
      products,
      mostProducedProduct: mostProduced,
      highestCostProduct: highestCost,
      lowestCostProduct: lowestCost,
      generatedAt: new Date(),
    };
  }

  // ──────────────────────────────────────────────────────────────
  // 6. VENDOR ANALYTICS
  // GET /analytics/vendors
  // ──────────────────────────────────────────────────────────────

  /**
   * Returns vendor cost analytics: supply value, variance, performance.
   */
  public async getVendorAnalytics(limit = 50): Promise<IVendorAnalytics> {
    this.logger.log('Computing vendor analytics');

    const costItems = await this.prisma.costItem.findMany({
      where: {
        isDeleted: false,
        vendorId: { not: null },
      },
      select: {
        vendorId: true,
        predictedAmount: true,
        actualAmount: true,
        vendor: {
          select: {
            id: true,
            vendorCode: true,
            vendorName: true,
          },
        },
      },
    });

    // Aggregate per vendor
    const vendorMap = new Map<
      string,
      {
        vendorCode: string;
        vendorName: string;
        totalCostItems: number;
        totalPredicted: number;
        totalActual: number | null;
        hasActuals: boolean;
      }
    >();

    for (const item of costItems) {
      if (!item.vendorId || !item.vendor) continue;
      const vid = item.vendorId;

      if (!vendorMap.has(vid)) {
        vendorMap.set(vid, {
          vendorCode: item.vendor.vendorCode,
          vendorName: item.vendor.vendorName,
          totalCostItems: 0,
          totalPredicted: 0,
          totalActual: null,
          hasActuals: false,
        });
      }

      const stats = vendorMap.get(vid)!;
      stats.totalCostItems++;
      stats.totalPredicted += Number(item.predictedAmount ?? 0);

      if (item.actualAmount !== null) {
        stats.totalActual = (stats.totalActual ?? 0) + Number(item.actualAmount);
        stats.hasActuals = true;
      }
    }

    const vendors: IVendorStat[] = [...vendorMap.entries()]
      .map(([vendorId, stats]) => {
        const variance =
          stats.hasActuals && stats.totalActual !== null
            ? stats.totalActual - stats.totalPredicted
            : null;
        const variancePct =
          variance !== null && stats.totalPredicted > 0
            ? Math.round((variance / stats.totalPredicted) * 10000) / 100
            : null;

        return {
          vendorId,
          vendorCode: stats.vendorCode,
          vendorName: stats.vendorName,
          totalCostItems: stats.totalCostItems,
          totalPredictedAmount: Math.round(stats.totalPredicted * 100) / 100,
          totalActualAmount:
            stats.totalActual !== null ? Math.round(stats.totalActual * 100) / 100 : null,
          totalVariance: variance !== null ? Math.round(variance * 100) / 100 : null,
          variancePercentage: variancePct,
        };
      })
      .sort((a, b) => b.totalPredictedAmount - a.totalPredictedAmount)
      .slice(0, limit);

    const highestUsage = vendors[0]?.vendorName ?? null;
    // Best performer = lowest absolute variance %
    const vendorsWithVariance = vendors.filter((v) => v.variancePercentage !== null);
    const bestPerformer =
      vendorsWithVariance.length > 0
        ? vendorsWithVariance.reduce((best, v) =>
            Math.abs(v.variancePercentage!) < Math.abs(best.variancePercentage!) ? v : best,
          ).vendorName
        : null;

    return {
      vendors,
      highestUsageVendor: highestUsage,
      bestPerformingVendor: bestPerformer,
      generatedAt: new Date(),
    };
  }

  // ──────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────────────────────

  /**
   * Builds a Prisma date-range filter for cost sheet queries.
   */
  private buildDateFilter(from?: Date, to?: Date): Record<string, any> {
    if (!from && !to) return {};
    const createdAt: Record<string, Date> = {};
    if (from) createdAt.gte = from;
    if (to) createdAt.lte = to;
    return { createdAt };
  }

  /**
   * Generates deterministic Business Insights & Trend Analysis.
   * Scoped by User and global query parameters.
   */
  public async getInsights(user: any, query: KpiQueryDto): Promise<IInsightsSummary> {
    this.logger.log(`Generating business insights for user: ${user.email}`);

    // Re-use the existing RBAC-guarded KPI logic
    const kpis = await this.kpiService.getKpis(user, query);
    const insights: IInsight[] = [];

    // Helper to format currency
    const formatCurrency = (val: number) => {
      return '₹' + Math.round(val).toLocaleString('en-IN');
    };

    // 1. Transaction Volume trend
    const indentsKpi = kpis.find((k) => k.id === 'total-indents');
    if (indentsKpi) {
      const current = indentsKpi.value;
      const pct = indentsKpi.trendPercentage;
      const isUp = indentsKpi.trend === 'up';
      const isDown = indentsKpi.trend === 'down';

      let prevVal = current;
      if (pct !== 0) {
        prevVal = isUp ? current / (1 + pct / 100) : current / (1 - Math.abs(pct) / 100);
      }
      prevVal = Math.round(prevVal);

      const directionText = isUp ? 'increased' : isDown ? 'decreased' : 'remained stable';
      insights.push({
        type: 'volume-growth',
        title: 'Indent Volume Trend',
        message: `Total indents ${directionText} by ${Math.abs(pct).toFixed(1)}% compared with the prior period (${current} vs ${prevVal} indents).`,
        severity: isUp ? 'SUCCESS' : isDown ? 'WARNING' : 'INFO',
        metric: 'total-indents',
        value: current,
        comparisonValue: prevVal,
        change: current - prevVal,
        changePercentage: pct,
        direction: indentsKpi.trend,
        period: 'vs prior period',
      });
    }

    // 2. Cost Variance Insight (RBAC Scoped by getKpis returning planned/actual cost)
    const plannedKpi = kpis.find((k) => k.id === 'total-planned-cost');
    const actualKpi = kpis.find((k) => k.id === 'total-actual-cost');
    const varianceKpi = kpis.find((k) => k.id === 'total-variance');

    if (plannedKpi && actualKpi && varianceKpi) {
      const planned = plannedKpi.value;
      const actual = actualKpi.value;
      const variance = varianceKpi.value;
      const variancePct = planned > 0 ? (variance / planned) * 100 : 0;

      const directionText = variance > 0 ? 'higher' : variance < 0 ? 'lower' : 'equal to';
      const severity =
        variancePct > 25
          ? 'CRITICAL'
          : variancePct > 10
            ? 'WARNING'
            : variance < 0
              ? 'SUCCESS'
              : 'INFO';

      insights.push({
        type: 'cost-variance',
        title: 'Planned vs. Actual Variance',
        message: `Actual cost is ${Math.abs(variancePct).toFixed(1)}% ${directionText} than planned cost (variance of ${formatCurrency(variance)}).`,
        severity,
        metric: 'cost-variance',
        value: actual,
        comparisonValue: planned,
        change: variance,
        changePercentage: Math.round(variancePct * 100) / 100,
        direction: variance > 0 ? 'up' : variance < 0 ? 'down' : 'stable',
        period: 'current filter',
      });
    }

    // 3. Operational Queue/Bottleneck Insights
    const storesKpi = kpis.find((k) => k.id === 'stores-pending');
    if (storesKpi && storesKpi.value > 0) {
      insights.push({
        type: 'stage-pending',
        title: 'Stores Active Load',
        message: `${storesKpi.value} indents are currently pending in Stores Processing stage.`,
        severity: storesKpi.value > 20 ? 'CRITICAL' : storesKpi.value > 10 ? 'WARNING' : 'INFO',
        metric: 'stores-pending',
        value: storesKpi.value,
        comparisonValue: null,
        change: null,
        changePercentage: null,
        direction: null,
        period: 'live',
      });
    }

    const designKpi = kpis.find((k) => k.id === 'design-pending');
    if (designKpi && designKpi.value > 0) {
      insights.push({
        type: 'stage-pending',
        title: 'Design Team Queue',
        message: `${designKpi.value} indents are currently pending in Design Completed stage.`,
        severity: designKpi.value > 15 ? 'WARNING' : 'INFO',
        metric: 'design-pending',
        value: designKpi.value,
        comparisonValue: null,
        change: null,
        changePercentage: null,
        direction: null,
        period: 'live',
      });
    }

    // 4. Stalled/Bottleneck Warning
    // Available to Managers & Admin roles (hasWorkflowAccess)
    const deptCode = user.department?.departmentCode;
    const isAdmin = user.permissions?.includes('settings.manage');
    const isManager = deptCode === 'SMGR' || deptCode === 'GMGR';

    if (isAdmin || isManager) {
      // Re-use internal methods
      const workflowAnal = await this.getWorkflowAnalytics();
      if (workflowAnal.stalledTransactions > 0) {
        insights.push({
          type: 'workflow-bottleneck',
          title: 'Workflow Bottleneck Warning',
          message: `${workflowAnal.stalledTransactions} transactions are stalled (>7 days). Bottleneck stage: ${workflowAnal.bottleneckStage || 'None'}.`,
          severity: 'WARNING',
          metric: 'stalled-transactions',
          value: workflowAnal.stalledTransactions,
          comparisonValue: 0,
          change: workflowAnal.stalledTransactions,
          changePercentage: null,
          direction: 'up',
          period: 'current filter',
        });
      }

      // Department Workload Insight
      const deptAnal = await this.getDepartmentAnalytics();
      const highestDept = deptAnal.departments.reduce(
        (max, dept) => (dept.pendingQueue > (max?.pendingQueue ?? -1) ? dept : max),
        deptAnal.departments[0],
      );
      if (highestDept && highestDept.pendingQueue > 0) {
        insights.push({
          type: 'department-load',
          title: 'High Workload Alert',
          message: `Department ${highestDept.departmentName} (${highestDept.departmentCode}) has the highest queue load with ${highestDept.pendingQueue} active items.`,
          severity: highestDept.pendingQueue > 15 ? 'WARNING' : 'INFO',
          metric: 'pending-queue',
          value: highestDept.pendingQueue,
          comparisonValue: highestDept.totalTransactions,
          change: null,
          changePercentage: null,
          direction: null,
          period: 'live queue',
        });
      }
    }

    // Build the dynamic textual summary
    const totalCount = indentsKpi ? indentsKpi.value : 0;
    const activeKpi = kpis.find((k) => k.id === 'active-indents');
    const activeCount = activeKpi ? activeKpi.value : 0;
    const completedKpi = kpis.find((k) => k.id === 'completed-indents');
    const completedCount = completedKpi ? completedKpi.value : 0;

    let summaryText = `During the selected period, a total of ${totalCount} indents were created/recorded. There are currently ${activeCount} active transactions moving through the workflow, and ${completedCount} indents were successfully completed.`;

    if (plannedKpi && plannedKpi.value > 0) {
      const planned = plannedKpi.value;
      const actual = actualKpi ? actualKpi.value : 0;
      const variance = varianceKpi ? varianceKpi.value : 0;
      const variancePct = (variance / planned) * 100;

      summaryText += ` Total planned costing represents ${formatCurrency(planned)} with actual finalized costs at ${formatCurrency(actual)}, resulting in a variance of ${formatCurrency(variance)} (${variancePct.toFixed(1)}%).`;
    }

    return {
      insights,
      summaryText,
      generatedAt: new Date(),
    };
  }
}
