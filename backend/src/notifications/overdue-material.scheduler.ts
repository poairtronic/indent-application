import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationEventType } from '../communication/events/communication-event.bus';
import { WorkflowState } from '../business-transaction/enums/workflow-state.enum';
import { CommunicationEventBus } from '../communication/events/communication-event.bus';

@Injectable()
export class OverdueMaterialScheduler {
  private readonly logger = new Logger(OverdueMaterialScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly communicationEventBus: CommunicationEventBus,
  ) {}

  @Cron('0 */15 * * * *')
  async handleOverdueMaterialChecks() {
    this.logger.log('Running 48-Hour Overdue Material Issue Check...');

    try {
      // 1. Check if the feature is enabled in system settings
      const setting = await this.prisma.applicationSetting.findUnique({
        where: { key: 'MATERIAL_ISSUE_OVERDUE_ALERTS_ENABLED' },
      });

      // Default is ON if the setting is missing, unless set to 'false'
      const isEnabled = setting ? setting.value === 'true' : true;
      if (!isEnabled) {
        this.logger.debug(
          'Material Issue Overdue Alerts are disabled in settings. Skipping check.',
        );
        return;
      }

      // 2. Find indents in STORES_PROCESSING
      const indents = await this.prisma.indent.findMany({
        where: {
          currentState: WorkflowState.STORES_PROCESSING,
          isDeleted: false,
        },
        include: {
          indentItems: {
            where: { isDeleted: false },
            include: { material: true },
          },
          product: true,
        },
      });

      if (indents.length > 0) {
        this.logger.log(`Found ${indents.length} indents in STORES_PROCESSING.`);
      }

      const now = new Date();
      const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

      for (const indent of indents) {
        const latestHistory = await this.prisma.workflowHistory.findFirst({
          where: { indentId: indent.id },
          orderBy: { movedAt: 'desc' },
        });

        if (!latestHistory) continue;

        const timeElapsedMs = now.getTime() - latestHistory.movedAt.getTime();
        if (timeElapsedMs < FORTY_EIGHT_HOURS_MS) {
          continue; // Not yet 48 hours
        }

        // 3. Calculate outstanding materials
        const outstandingMaterials = indent.indentItems
          .map((item) => {
            const requiredQty = Number(item.quantity);
            const issuedQty = Number(item.issuedQuantity || 0);
            const remainingQty = requiredQty - issuedQty;

            return {
              materialName: item.material?.materialName || 'Unknown Material',
              requiredQty,
              issuedQty,
              remainingQty,
            };
          })
          .filter((m) => m.remainingQty > 0);

        if (outstandingMaterials.length === 0) {
          continue;
        }

        // 4. Idempotency Check
        const existingAlert = await this.prisma.notification.findFirst({
          where: {
            eventType: CommunicationEventType.MATERIAL_ISSUE_OVERDUE,
            referenceId: indent.id,
          },
        });

        if (existingAlert) {
          continue;
        }

        const totalRemaining = outstandingMaterials.reduce(
          (acc, curr) => acc + curr.remainingQty,
          0,
        );
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const transactionUrl = `${frontendUrl}/indents/${indent.id}`;

        this.logger.log(`Triggering Overdue Alert for Indent ${indent.indentNumber}.`);

        const payload = {
          indentId: indent.id,
          indentNumber: indent.indentNumber,
          productName: indent.product?.productName || 'Unknown',
          storesProcessingStartedAt: latestHistory.movedAt.toLocaleString(),
          overdueSince: new Date(
            latestHistory.movedAt.getTime() + FORTY_EIGHT_HOURS_MS,
          ).toLocaleString(),
          outstandingMaterials,
          totalRemaining,
          transactionUrl,
          referenceId: indent.id,
          referenceModule: 'Indent',
          targetState: WorkflowState.STORES_PROCESSING + '_OVERDUE',
        };

        this.communicationEventBus.emit(CommunicationEventType.MATERIAL_ISSUE_OVERDUE, payload);
      }
    } catch (error: any) {
      this.logger.error('Error in OverdueMaterialScheduler', error?.stack);
    }
  }
}
