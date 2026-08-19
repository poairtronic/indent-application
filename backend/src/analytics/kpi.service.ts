import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KpiQueryDto } from './dto/kpi-query.dto';
import { IndentStatus } from '@prisma/client';

export interface KpiData {
  id: string;
  label: string;
  value: number;
  unit: 'count' | 'currency' | 'percentage' | 'hours';
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  comparisonPeriod: string;
  status: 'normal' | 'warning' | 'critical';
}

const ACTIVE_STATUSES = [
  IndentStatus.SUBMITTED,
  IndentStatus.PENDING_STORES,
  IndentStatus.IN_PRODUCTION,
  IndentStatus.APPROVED,
  IndentStatus.PENDING_ACCOUNTS,
  IndentStatus.PENDING_SENIOR_MANAGER,
];

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  constructor(private readonly prisma: PrismaService) {}

  public async getKpis(user: any, query: KpiQueryDto): Promise<KpiData[]> {
    this.logger.log(`Calculating KPIs for user: ${user.email}`);

    const { dateFrom, dateTo, departmentId, productId, vendorId, processCode, status } = query;
    const now = new Date();

    const currentFrom = dateFrom
      ? new Date(dateFrom)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const currentTo = dateTo ? new Date(dateTo) : now;

    // Prior period: equivalent duration immediately before the current window
    const diffMs = currentTo.getTime() - currentFrom.getTime();
    const prevFrom = new Date(currentFrom.getTime() - diffMs);
    const prevTo = new Date(currentFrom.getTime() - 1);

    // Build base Prisma filter objects
    const currentFilter: any = { isDeleted: false };
    const prevFilter: any = { isDeleted: false };

    if (productId) {
      currentFilter.productId = productId;
      prevFilter.productId = productId;
    }
    if (departmentId) {
      currentFilter.departmentId = departmentId;
      prevFilter.departmentId = departmentId;
    }
    if (status) {
      currentFilter.status = status;
      prevFilter.status = status;
    }
    if (vendorId) {
      const vendorSubQuery = {
        costSheet: { costItems: { some: { vendorId, isDeleted: false } } },
      };
      Object.assign(currentFilter, vendorSubQuery);
      Object.assign(prevFilter, vendorSubQuery);
    }
    if (processCode) {
      const processSubQuery = {
        product: { manufacturingProcesses: { some: { processCode, isDeleted: false } } },
      };
      Object.assign(currentFilter, processSubQuery);
      Object.assign(prevFilter, processSubQuery);
    }

    // RBAC scoping
    const deptCode = user.department?.departmentCode;
    const isAdmin = user.permissions?.includes('settings.manage');
    const isManager = deptCode === 'SMGR' || deptCode === 'GMGR';

    if (!isAdmin && !isManager) {
      currentFilter.departmentId = user.departmentId;
      prevFilter.departmentId = user.departmentId;
    }

    const kpis: KpiData[] = [];

    const hasFinancialAccess = isAdmin || isManager || deptCode === 'ACCT';
    const hasWorkflowAccess = isAdmin || isManager || deptCode === 'DSGN' || deptCode === 'STOR';

    // ── General & Manufacturing KPIs ──────────────────────────────
    // SQL-side aggregation: fetch per-status counts once and derive every
    // stage/active/total KPI from the maps (replacing the previous
    // 20 individual count() queries without changing any value).
    // Note: the original active/completed/in-production counts overrode the
    // status filter (they counted across ALL statuses), whereas
    // total-indents and the workflow-stage KPIs honoured it. We reproduce
    // that exactly by grouping WITHOUT the status filter and reading the
    // relevant status(es) from the full per-status map.
    const currentCountFilter = { ...currentFilter };
    delete currentCountFilter.status;
    const prevCountFilter = { ...prevFilter };
    delete prevCountFilter.status;
    const [currentByStatus, prevByStatus, completedCurrentByUpdated, completedPrevByUpdated] =
      await Promise.all([
        this.prisma.indent.groupBy({
          by: ['status'],
          where: { ...currentCountFilter, createdAt: { gte: currentFrom, lte: currentTo } },
          _count: { id: true },
        }),
        this.prisma.indent.groupBy({
          by: ['status'],
          where: { ...prevCountFilter, createdAt: { gte: prevFrom, lte: prevTo } },
          _count: { id: true },
        }),
        this.prisma.indent.groupBy({
          by: ['status'],
          where: { ...currentCountFilter, updatedAt: { gte: currentFrom, lte: currentTo } },
          _count: { id: true },
        }),
        this.prisma.indent.groupBy({
          by: ['status'],
          where: { ...prevCountFilter, updatedAt: { gte: prevFrom, lte: prevTo } },
          _count: { id: true },
        }),
      ]);

    const toStatusMap = (rows: { status: IndentStatus; _count: { id: number } }[]) => {
      const map = new Map<string, number>();
      for (const row of rows) map.set(row.status, row._count.id);
      return map;
    };
    const sumStatuses = (map: Map<string, number>, statuses: IndentStatus[]) =>
      statuses.reduce((sum, s) => sum + (map.get(s) ?? 0), 0);
    const totalCount = (map: Map<string, number>) =>
      Array.from(map.values()).reduce((sum, c) => sum + c, 0);

    const currentStatusCounts = toStatusMap(currentByStatus);
    const prevStatusCounts = toStatusMap(prevByStatus);
    const completedCurrentCounts = toStatusMap(completedCurrentByUpdated);
    const completedPrevCounts = toStatusMap(completedPrevByUpdated);

    // When a status filter is active, the original total-indents count
    // respected it (only that status); otherwise it summed every status.
    const indentsCurrent = status
      ? (currentStatusCounts.get(status) ?? 0)
      : totalCount(currentStatusCounts);
    const indentsPrev = status ? (prevStatusCounts.get(status) ?? 0) : totalCount(prevStatusCounts);
    const activeCurrent = sumStatuses(currentStatusCounts, ACTIVE_STATUSES);
    const activePrev = sumStatuses(prevStatusCounts, ACTIVE_STATUSES);
    const completedCurrent = completedCurrentCounts.get(IndentStatus.COMPLETED) ?? 0;
    const completedPrev = completedPrevCounts.get(IndentStatus.COMPLETED) ?? 0;
    const inProductionCurrent = currentStatusCounts.get(IndentStatus.IN_PRODUCTION) ?? 0;
    const inProductionPrev = prevStatusCounts.get(IndentStatus.IN_PRODUCTION) ?? 0;

    kpis.push(
      this.buildKpi('total-indents', 'Total Indents', indentsCurrent, indentsPrev, 'count', true),
      this.buildKpi('active-indents', 'Active Indents', activeCurrent, activePrev, 'count', true),
      this.buildKpi(
        'completed-indents',
        'Completed Indents',
        completedCurrent,
        completedPrev,
        'count',
        true,
      ),
      this.buildKpi(
        'production-in-progress',
        'Production In Progress',
        inProductionCurrent,
        inProductionPrev,
        'count',
        true,
      ),
    );

    // ── Financial KPIs ────────────────────────────────────────────
    if (hasFinancialAccess) {
      const [
        costCurrent,
        costPrev,
        materialCostCurrent,
        materialCostPrev,
        processCostCurrent,
        processCostPrev,
      ] = await Promise.all([
        this.prisma.costSheet.aggregate({
          _sum: { predictedTotal: true, actualTotal: true, varianceAmount: true },
          _avg: { predictedTotal: true, actualTotal: true },
          where: {
            isDeleted: false,
            createdAt: { gte: currentFrom, lte: currentTo },
            indent: currentFilter,
          },
        }),
        this.prisma.costSheet.aggregate({
          _sum: { predictedTotal: true, actualTotal: true, varianceAmount: true },
          where: {
            isDeleted: false,
            createdAt: { gte: prevFrom, lte: prevTo },
            indent: prevFilter,
          },
        }),
        this.prisma.costItem.aggregate({
          _sum: { actualAmount: true, predictedAmount: true },
          where: {
            isDeleted: false,
            createdAt: { gte: currentFrom, lte: currentTo },
            costSheet: { indent: currentFilter },
          },
        }),
        this.prisma.costItem.aggregate({
          _sum: { actualAmount: true },
          where: {
            isDeleted: false,
            createdAt: { gte: prevFrom, lte: prevTo },
            costSheet: { indent: prevFilter },
          },
        }),
        this.prisma.processCost.aggregate({
          _sum: { actualCost: true, predictedCost: true },
          where: {
            isDeleted: false,
            createdAt: { gte: currentFrom, lte: currentTo },
            costSheet: { indent: currentFilter },
          },
        }),
        this.prisma.processCost.aggregate({
          _sum: { actualCost: true },
          where: {
            isDeleted: false,
            createdAt: { gte: prevFrom, lte: prevTo },
            costSheet: { indent: prevFilter },
          },
        }),
      ]);

      const plannedCurrent = Number(costCurrent._sum.predictedTotal ?? 0);
      const plannedPrev = Number(costPrev._sum.predictedTotal ?? 0);
      const actualCurrent = Number(costCurrent._sum.actualTotal ?? 0);
      const actualPrev = Number(costPrev._sum.actualTotal ?? 0);
      const varianceCurrent = Number(costCurrent._sum.varianceAmount ?? 0);
      const variancePrev = Number(costPrev._sum.varianceAmount ?? 0);

      const plannedFinalizedCurrent = actualCurrent - varianceCurrent;
      const plannedFinalizedPrev = actualPrev - variancePrev;

      const avgPlannedCurrent = Number(costCurrent._avg.predictedTotal ?? 0);
      const avgActualCurrent = Number(costCurrent._avg.actualTotal ?? 0);
      const variancePctCurrent =
        plannedFinalizedCurrent > 0 ? (varianceCurrent / plannedFinalizedCurrent) * 100 : 0;
      const variancePctPrev =
        plannedFinalizedPrev > 0 ? (variancePrev / plannedFinalizedPrev) * 100 : 0;

      const matCostCurrent = Number(
        materialCostCurrent._sum.actualAmount ?? materialCostCurrent._sum.predictedAmount ?? 0,
      );
      const matCostPrev = Number(materialCostPrev._sum.actualAmount ?? 0);

      const procCostCurrent = Number(
        processCostCurrent._sum.actualCost ?? processCostCurrent._sum.predictedCost ?? 0,
      );
      const procCostPrev = Number(processCostPrev._sum.actualCost ?? 0);

      kpis.push(
        this.buildKpi(
          'total-planned-cost',
          'Total Planned Cost',
          plannedCurrent,
          plannedPrev,
          'currency',
          false,
        ),
        this.buildKpi(
          'total-actual-cost',
          'Total Actual Cost',
          actualCurrent,
          actualPrev,
          'currency',
          false,
        ),
        this.buildKpi(
          'total-variance',
          'Total Cost Variance',
          varianceCurrent,
          variancePrev,
          'currency',
          false,
        ),
        this.buildKpi(
          'average-planned-cost',
          'Avg Planned Cost',
          avgPlannedCurrent,
          0,
          'currency',
          false,
        ),
        this.buildKpi(
          'average-actual-cost',
          'Avg Actual Cost',
          avgActualCurrent,
          0,
          'currency',
          false,
        ),
        this.buildKpi(
          'cost-variance-pct',
          'Cost Variance %',
          variancePctCurrent,
          variancePctPrev,
          'percentage',
          false,
        ),
        this.buildKpi(
          'total-material-cost',
          'Material Cost Total',
          matCostCurrent,
          matCostPrev,
          'currency',
          false,
        ),
        this.buildKpi(
          'total-process-cost',
          'Process Cost Total',
          procCostCurrent,
          procCostPrev,
          'currency',
          false,
        ),
      );
    }

    // ── Workflow Stage Distribution KPIs ──────────────────────────
    // Reuses the per-status maps already fetched via SQL groupBy above
    // (same filters/date windows), avoiding 12 additional count() queries.
    if (hasWorkflowAccess) {
      const draftCountCurrent = currentStatusCounts.get(IndentStatus.DRAFT) ?? 0;
      const draftCountPrev = prevStatusCounts.get(IndentStatus.DRAFT) ?? 0;
      const designCountCurrent = currentStatusCounts.get(IndentStatus.SUBMITTED) ?? 0;
      const designCountPrev = prevStatusCounts.get(IndentStatus.SUBMITTED) ?? 0;
      const storesCountCurrent = currentStatusCounts.get(IndentStatus.PENDING_STORES) ?? 0;
      const storesCountPrev = prevStatusCounts.get(IndentStatus.PENDING_STORES) ?? 0;
      const productionCountCurrent = currentStatusCounts.get(IndentStatus.IN_PRODUCTION) ?? 0;
      const productionCountPrev = prevStatusCounts.get(IndentStatus.IN_PRODUCTION) ?? 0;
      const accountsCountCurrent = currentStatusCounts.get(IndentStatus.PENDING_ACCOUNTS) ?? 0;
      const accountsCountPrev = prevStatusCounts.get(IndentStatus.PENDING_ACCOUNTS) ?? 0;
      const archivedCountCurrent =
        currentStatusCounts.get(IndentStatus.PENDING_GENERAL_MANAGER) ?? 0;
      const archivedCountPrev = prevStatusCounts.get(IndentStatus.PENDING_GENERAL_MANAGER) ?? 0;

      kpis.push(
        this.buildKpi(
          'draft-transactions',
          'Draft Transactions',
          draftCountCurrent,
          draftCountPrev,
          'count',
          true,
        ),
        this.buildKpi(
          'design-pending',
          'Design Pending',
          designCountCurrent,
          designCountPrev,
          'count',
          false,
        ),
        this.buildKpi(
          'stores-pending',
          'Stores Pending',
          storesCountCurrent,
          storesCountPrev,
          'count',
          false,
        ),
        this.buildKpi(
          'production-pending',
          'Production Pending',
          productionCountCurrent,
          productionCountPrev,
          'count',
          false,
        ),
        this.buildKpi(
          'accounts-pending',
          'Accounts Pending',
          accountsCountCurrent,
          accountsCountPrev,
          'count',
          false,
        ),
        this.buildKpi(
          'archived-transactions',
          'Archived Transactions',
          archivedCountCurrent,
          archivedCountPrev,
          'count',
          true,
        ),
      );
    }

    // ── Workflow Performance KPIs (Managers / Admins only) ────────
    if (isAdmin || isManager) {
      const indentsWithHistory = await this.prisma.indent.findMany({
        where: {
          isDeleted: false,
          createdAt: { gte: currentFrom, lte: currentTo },
        },
        select: {
          status: true,
          createdAt: true,
          workflowHistory: {
            where: { isDeleted: false },
            orderBy: { movedAt: 'asc' },
            select: { movedAt: true },
          },
        },
      });

      let totalWorkflowDuration = 0;
      let totalWorkflowCount = 0;
      let totalStoresTime = 0;
      let totalStoresCount = 0;
      let totalAccountsTime = 0;
      let totalAccountsCount = 0;

      indentsWithHistory.forEach((indent) => {
        const history = indent.workflowHistory as any[];
        if (history.length === 0) return;

        // Total workflow cycle time for completed indents
        if (indent.status === 'COMPLETED') {
          const lastMove = history[history.length - 1];
          const diffHours =
            (lastMove.movedAt.getTime() - indent.createdAt.getTime()) / (1000 * 60 * 60);
          totalWorkflowDuration += diffHours;
          totalWorkflowCount++;
        }

        // Stage segment timing via adjacent transition pairs
        for (let i = 0; i < history.length - 1; i++) {
          const curr = history[i];
          const next = history[i + 1];
          const durationHours =
            (next.movedAt.getTime() - curr.movedAt.getTime()) / (1000 * 60 * 60);

          // We identify stages by the status reflected in the toDepartment mapping.
          // Without a direct stageName in history, we use the index heuristic.
          // Stores processing is typically the 2nd transition (index 1)
          if (i === 1) {
            totalStoresTime += durationHours;
            totalStoresCount++;
          }
          // Accounts processing is typically the 4th transition (index 3)
          if (i === 3) {
            totalAccountsTime += durationHours;
            totalAccountsCount++;
          }
        }
      });

      const avgWorkflow = totalWorkflowCount > 0 ? totalWorkflowDuration / totalWorkflowCount : 0;
      const avgStores = totalStoresCount > 0 ? totalStoresTime / totalStoresCount : 0;
      const avgAccounts = totalAccountsCount > 0 ? totalAccountsTime / totalAccountsCount : 0;

      kpis.push(
        this.buildKpi(
          'avg-workflow-duration',
          'Avg Workflow Duration',
          Math.round(avgWorkflow * 10) / 10,
          0,
          'hours',
          false,
        ),
        this.buildKpi(
          'avg-stores-time',
          'Avg Stores Processing Time',
          Math.round(avgStores * 10) / 10,
          0,
          'hours',
          false,
        ),
        this.buildKpi(
          'avg-accounts-time',
          'Avg Accounts Processing Time',
          Math.round(avgAccounts * 10) / 10,
          0,
          'hours',
          false,
        ),
      );
    }

    return kpis;
  }

  private buildKpi(
    id: string,
    label: string,
    current: number,
    previous: number,
    unit: 'count' | 'currency' | 'percentage' | 'hours',
    _higherIsBetter: boolean,
  ): KpiData {
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercentage = 0;

    if (previous > 0) {
      trendPercentage = Math.round(((current - previous) / previous) * 100 * 10) / 10;
    } else if (current > 0) {
      trendPercentage = 100;
    }

    if (trendPercentage > 0) {
      trend = 'up';
    } else if (trendPercentage < 0) {
      trend = 'down';
    }

    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (id === 'total-variance' || id === 'cost-variance-pct') {
      if (current > 10) status = 'warning';
      if (current > 25) status = 'critical';
    }

    return {
      id,
      label,
      value: Math.round(current * 100) / 100,
      unit,
      trend,
      trendPercentage,
      comparisonPeriod: 'vs prior period',
      status,
    };
  }
}
