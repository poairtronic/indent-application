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

    const [stateCounts, completedIndents, total, activeIndents] = await Promise.all([
      // SQL-side groupBy: returns ~5-10 rows instead of thousands of indent objects
      this.prisma.indent.groupBy({
        by: ['currentState'],
        where: { isDeleted: false },
        _count: { id: true },
      }),
      // Completed indents with timestamps for cycle time calculation
      this.prisma.indent.findMany({
        where: { isDeleted: false, status: IndentStatus.COMPLETED },
        select: { createdAt: true, updatedAt: true },
      }),
      // Total non-deleted
      this.prisma.indent.count({ where: { isDeleted: false } }),
      // Active indents to evaluate stalled duration based on current state entry timestamp (BUG-KPI-001)
      this.prisma.indent.findMany({
        where: {
          isDeleted: false,
          status: { in: ACTIVE_STATUSES },
        },
        select: {
          id: true,
          createdAt: true,
          workflowHistory: {
            where: { isDeleted: false },
            orderBy: { movedAt: 'desc' },
            take: 1,
            select: { movedAt: true },
          },
        },
      }),
    ]);

    // Compute stalled transactions: active indents whose current state entry timestamp is > 7 days ago
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let stalledCount = 0;
    for (const indent of activeIndents) {
      const stateEnteredAt =
        indent.workflowHistory && indent.workflowHistory.length > 0
          ? new Date(indent.workflowHistory[0].movedAt)
          : new Date(indent.createdAt);

      if (stateEnteredAt <= sevenDaysAgo) {
        stalledCount++;
      }
    }

    // Build domain state counts directly from SQL groupBy result
    const domainStateCounts = new Map<string, number>();
    for (const row of stateCounts) {
      const domainState = row.currentState || 'DRAFT';
      domainStateCounts.set(domainState, row._count.id);
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

    // SQL-side: group indents by departmentId + status in one query
    const [departments, deptStatusCounts] = await Promise.all([
      this.prisma.department.findMany({
        where: { isDeleted: false, status: 'ACTIVE' },
        select: { id: true, departmentCode: true, departmentName: true },
      }),
      this.prisma.indent.groupBy({
        by: ['departmentId', 'status'],
        where: { isDeleted: false },
        _count: { id: true },
      }),
    ]);

    // Build a map: departmentId → { total, pending, completed }
    const deptMap = new Map<string, { total: number; pending: number; completed: number }>();
    for (const dept of departments) {
      deptMap.set(dept.id, { total: 0, pending: 0, completed: 0 });
    }

    for (const row of deptStatusCounts) {
      const stats = deptMap.get(row.departmentId);
      if (!stats) continue;
      stats.total += row._count.id;
      if (row.status === IndentStatus.COMPLETED) {
        stats.completed += row._count.id;
      } else if (PENDING_STATUSES.includes(row.status as IndentStatus)) {
        stats.pending += row._count.id;
      }
    }

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
    const where = { isDeleted: false, ...dateFilter };

    // SQL-side aggregation: 3 parallel queries instead of findMany + JS reduce
    const [totals, conditional, statusCounts] = await Promise.all([
      this.prisma.costSheet.aggregate({
        where,
        _sum: { predictedTotal: true, actualTotal: true, varianceAmount: true },
        _count: { id: true },
      }),
      this.prisma.costSheet.aggregate({
        where: { ...where, actualTotal: { not: null } },
        _sum: { variancePercentage: true },
        _count: { id: true },
      }),
      this.prisma.costSheet.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
    ]);

    const totalPlanned = Number(totals._sum.predictedTotal ?? 0);
    const totalActual = Number(totals._sum.actualTotal ?? 0);
    const totalVariance = Number(totals._sum.varianceAmount ?? 0);
    const totalFinalizedPlanned = totalActual - totalVariance;
    const sheetsWithActuals = conditional._count.id;
    const variancePercentageSum = Number(conditional._sum.variancePercentage ?? 0);
    const averageVariancePercentage =
      sheetsWithActuals > 0
        ? Math.round((variancePercentageSum / sheetsWithActuals) * 100) / 100
        : 0;

    const statusMap = new Map(statusCounts.map((r) => [r.status, r._count.id]));
    const finalizedCount = statusMap.get('FINALIZED') ?? 0;
    const draftCount = statusMap.get('DRAFT') ?? 0;

    return {
      totalPlannedCost: Math.round(totalPlanned * 100) / 100,
      totalFinalizedPlannedCost: Math.round(totalFinalizedPlanned * 100) / 100,
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

    // Single SQL query: JOIN indents + products + costSheets, GROUP BY productId
    const rows = await this.prisma.$queryRaw<
      {
        productId: string;
        productCode: string;
        productName: string;
        indentCount: number;
        averagePlannedCost: number | null;
        averageActualCost: number | null;
        highestPlannedCost: number | null;
        lowestPlannedCost: number | null;
      }[]
    >`
      SELECT
        i."productId",
        p."productCode",
        p."productName",
        COUNT(i."id")::int AS "indentCount",
        AVG(cs."predictedTotal")::float AS "averagePlannedCost",
        AVG(cs."actualTotal")::float   AS "averageActualCost",
        MAX(cs."predictedTotal")::float AS "highestPlannedCost",
        MIN(cs."predictedTotal")::float AS "lowestPlannedCost"
      FROM "indents" i
      JOIN "products" p ON p."id" = i."productId" AND p."isDeleted" = false
      LEFT JOIN "cost_sheets" cs ON cs."indentId" = i."id" AND cs."isDeleted" = false
      WHERE i."isDeleted" = false
      GROUP BY i."productId", p."productCode", p."productName"
      ORDER BY "indentCount" DESC
      LIMIT ${limit}
    `;

    // Build output with rounding
    const products: IProductStat[] = rows.map((r) => ({
      productId: r.productId,
      productCode: r.productCode,
      productName: r.productName,
      indentCount: r.indentCount,
      averagePlannedCost:
        r.averagePlannedCost !== null ? Math.round(r.averagePlannedCost * 100) / 100 : 0,
      averageActualCost:
        r.averageActualCost !== null ? Math.round(r.averageActualCost * 100) / 100 : null,
      highestPlannedCost:
        r.highestPlannedCost !== null ? Math.round(r.highestPlannedCost * 100) / 100 : 0,
      lowestPlannedCost:
        r.lowestPlannedCost !== null ? Math.round(r.lowestPlannedCost * 100) / 100 : 0,
    }));

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

    // SQL-side: group cost items by vendorId with sums
    const vendorAggregates = await this.prisma.costItem.groupBy({
      by: ['vendorId'],
      where: { isDeleted: false, vendorId: { not: null } },
      _sum: { predictedAmount: true, actualAmount: true },
      _count: { id: true },
    });

    // Batch-fetch vendor names for the vendorIds present in aggregates
    const vendorIds = vendorAggregates.map((r) => r.vendorId!);
    const vendors = vendorIds.length
      ? await this.prisma.vendor.findMany({
          where: { id: { in: vendorIds }, isDeleted: false },
          select: { id: true, vendorCode: true, vendorName: true },
        })
      : [];
    const vendorLookup = new Map(vendors.map((v) => [v.id, v]));

    const vendorStats: IVendorStat[] = vendorAggregates
      .map((row) => {
        const vendor = vendorLookup.get(row.vendorId!);
        if (!vendor) return null;
        const totalPredicted = Number(row._sum.predictedAmount ?? 0);
        const totalActual = row._sum.actualAmount !== null ? Number(row._sum.actualAmount) : null;
        const variance = totalActual !== null ? totalActual - totalPredicted : null;
        const variancePct =
          variance !== null && totalPredicted > 0
            ? Math.round((variance / totalPredicted) * 10000) / 100
            : null;

        return {
          vendorId: row.vendorId!,
          vendorCode: vendor.vendorCode,
          vendorName: vendor.vendorName,
          totalCostItems: row._count.id,
          totalPredictedAmount: Math.round(totalPredicted * 100) / 100,
          totalActualAmount: totalActual !== null ? Math.round(totalActual * 100) / 100 : null,
          totalVariance: variance !== null ? Math.round(variance * 100) / 100 : null,
          variancePercentage: variancePct,
        };
      })
      .filter((v): v is IVendorStat => v !== null)
      .sort((a, b) => b.totalPredictedAmount - a.totalPredictedAmount)
      .slice(0, limit);

    const highestUsage = vendorStats[0]?.vendorName ?? null;
    const vendorsWithVariance = vendorStats.filter((v) => v.variancePercentage !== null);
    const bestPerformer =
      vendorsWithVariance.length > 0
        ? vendorsWithVariance.reduce((best, v) =>
            Math.abs(v.variancePercentage!) < Math.abs(best.variancePercentage!) ? v : best,
          ).vendorName
        : null;

    return {
      vendors: vendorStats,
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

  /**
   * Consolidated Dashboard Overview
   * Combines summary, workflow, departments, costs, and products into a single parallel operation.
   */
  public async getDashboardOverview(): Promise<{
    summary: IExecutiveSummary;
    workflow: IWorkflowAnalytics;
    departments: IDepartmentAnalytics;
    costs: ICostAnalytics;
    products: IProductAnalytics;
  }> {
    this.logger.log('Computing consolidated dashboard overview analytics');
    const [summary, workflow, departments, costs, products] = await Promise.all([
      this.getExecutiveSummary(),
      this.getWorkflowAnalytics(),
      this.getDepartmentAnalytics(),
      this.getCostAnalytics(),
      this.getProductAnalytics(50),
    ]);

    return {
      summary,
      workflow,
      departments,
      costs,
      products,
    };
  }
}
