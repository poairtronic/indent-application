import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  CommunicationEventType,
  CommunicationEventBus,
} from '../communication/events/communication-event.bus';
import { WorkflowState } from '../business-transaction/enums/workflow-state.enum';

export const DEFAULT_OVERDUE_MATERIAL_CRON = '0 0 9,15 * * *';
export const DEFAULT_APP_TIMEZONE = 'Asia/Kolkata';
export const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
export const SCHEDULER_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
export const OVERDUE_SCHEDULER_LOCK_KEY = 'OVERDUE_MATERIAL_SCHEDULER_LOCK';
export const OVERDUE_SETTING_KEY = 'MATERIAL_ISSUE_OVERDUE_ALERTS_ENABLED';

const OVERDUE_MATERIAL_CRON_SCHEDULE =
  process.env.OVERDUE_MATERIAL_CRON_SCHEDULE || DEFAULT_OVERDUE_MATERIAL_CRON;
const OVERDUE_MATERIAL_TIMEZONE =
  process.env.APP_TIMEZONE || DEFAULT_APP_TIMEZONE;

export interface IOverdueMaterialCheckResult {
  processedCount: number;
  alertedCount: number;
  skippedReason?: string;
}

@Injectable()
export class OverdueMaterialScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(OverdueMaterialScheduler.name);
  private isProcessing = false;
  private startupTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly communicationEventBus: CommunicationEventBus,
  ) {}

  public onApplicationBootstrap(): void {
    const isStartupCheckEnabled =
      process.env.OVERDUE_MATERIAL_STARTUP_CHECK_ENABLED !== 'false';
    if (isStartupCheckEnabled) {
      this.logger.log(
        `Scheduling startup overdue material recovery check (delayed 10s) in timezone ${OVERDUE_MATERIAL_TIMEZONE}...`,
      );
      this.startupTimer = setTimeout(() => {
        this.handleOverdueMaterialChecks().catch((err) => {
          this.logger.error(
            'Error during startup overdue material check',
            err?.stack,
          );
        });
      }, 10000);
    }
  }

  public onModuleDestroy(): void {
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
      this.logger.log('Cancelled pending startup overdue check timer.');
    }
  }

  public getSchedulerStatus(): {
    isProcessing: boolean;
    cronSchedule: string;
    timezone: string;
    startupCheckEnabled: boolean;
  } {
    return {
      isProcessing: this.isProcessing,
      cronSchedule: OVERDUE_MATERIAL_CRON_SCHEDULE,
      timezone: OVERDUE_MATERIAL_TIMEZONE,
      startupCheckEnabled:
        process.env.OVERDUE_MATERIAL_STARTUP_CHECK_ENABLED !== 'false',
    };
  }

  /**
   * Main cron entrypoint.
   * Runs at 09:00 and 15:00 IST (configurable via OVERDUE_MATERIAL_CRON_SCHEDULE and APP_TIMEZONE)
   * to check indents stalled in STORES_PROCESSING for > 48 hours.
   */
  @Cron(OVERDUE_MATERIAL_CRON_SCHEDULE, {
    name: 'overdue-material-check',
    timeZone: OVERDUE_MATERIAL_TIMEZONE,
  })
  public async handleOverdueMaterialChecks(): Promise<IOverdueMaterialCheckResult> {
    if (this.isProcessing) {
      this.logger.warn(
        'Overdue material check already in progress locally. Skipping overlapping execution.',
      );
      return {
        processedCount: 0,
        alertedCount: 0,
        skippedReason: 'ALREADY_RUNNING_LOCALLY',
      };
    }

    this.isProcessing = true;
    let distributedLockValue: string | null = null;

    try {
      // 1. Acquire distributed lock across multiple backend instances
      distributedLockValue = await this.acquireDistributedLock(
        OVERDUE_SCHEDULER_LOCK_KEY,
        SCHEDULER_LOCK_TIMEOUT_MS,
      );

      if (!distributedLockValue) {
        this.logger.debug(
          'Another instance holds the overdue material check lock. Skipping execution.',
        );
        return {
          processedCount: 0,
          alertedCount: 0,
          skippedReason: 'LOCK_HELD_BY_ANOTHER_INSTANCE',
        };
      }

      this.logger.log('Running 48-Hour Overdue Material Issue Check...');

      // 2. Check if the feature is enabled in system settings
      const setting = await this.prisma.applicationSetting.findUnique({
        where: { key: OVERDUE_SETTING_KEY },
      });

      // Default is ON if the setting is missing, unless explicitly set to 'false'
      const isEnabled = setting ? setting.value === 'true' : true;
      if (!isEnabled) {
        this.logger.debug(
          'Material Issue Overdue Alerts are disabled in settings. Skipping check.',
        );
        return {
          processedCount: 0,
          alertedCount: 0,
          skippedReason: 'DISABLED_IN_SETTINGS',
        };
      }

      // 3. Find indents in STORES_PROCESSING with their items, product, and latest workflow history
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
          workflowHistory: {
            orderBy: { movedAt: 'desc' },
            take: 1,
          },
        },
      });

      if (indents.length === 0) {
        this.logger.debug(
          'No indents found in STORES_PROCESSING. Entering sleep.',
        );
        return {
          processedCount: 0,
          alertedCount: 0,
          skippedReason: 'NO_INDENTS_IN_STORES',
        };
      }

      this.logger.log(`Found ${indents.length} indents in STORES_PROCESSING.`);

      // 4. Batch query existing alerts to eliminate N+1 queries
      const indentIds = indents.map((i) => i.id);
      const existingAlerts = await this.prisma.notification.findMany({
        where: {
          eventType: CommunicationEventType.MATERIAL_ISSUE_OVERDUE,
          referenceId: { in: indentIds },
          isDeleted: false,
        },
        select: { referenceId: true },
      });
      const existingAlertSet = new Set(
        existingAlerts.map((a) => a.referenceId).filter(Boolean),
      );

      // Cache recipient users for notification creation
      let recipientUsersCache: Array<{ id: string }> | null = null;
      const getRecipientUsers = async () => {
        if (!recipientUsersCache) {
          recipientUsersCache = await this.prisma.user.findMany({
            where: {
              isDeleted: false,
              status: 'ACTIVE',
              OR: [
                {
                  role: {
                    roleName: {
                      in: [
                        'Admin',
                        'ADMIN',
                        'System Administrator',
                        'Senior Manager',
                        'General Manager',
                      ],
                    },
                  },
                },
                {
                  department: {
                    departmentCode: { in: ['STORES', 'STOR'] },
                  },
                },
              ],
            },
            select: { id: true },
          });
        }
        return recipientUsersCache;
      };

      const now = new Date();
      let alertedCount = 0;

      for (const indent of indents) {
        const latestHistory = indent.workflowHistory?.[0];
        const movedAt = latestHistory?.movedAt || indent.createdAt;

        const timeElapsedMs = now.getTime() - new Date(movedAt).getTime();
        if (timeElapsedMs < FORTY_EIGHT_HOURS_MS) {
          continue; // Not yet 48 hours
        }

        // 5. Calculate outstanding materials
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

        // 6. Idempotency Check (via batch query set)
        if (existingAlertSet.has(indent.id)) {
          continue;
        }

        const totalRemaining = outstandingMaterials.reduce(
          (acc, curr) => acc + curr.remainingQty,
          0,
        );
        const frontendUrl =
          process.env.FRONTEND_URL || 'http://localhost:5173';
        const transactionUrl = `${frontendUrl}/indents/${indent.id}`;

        this.logger.log(
          `Triggering Overdue Alert for Indent ${indent.indentNumber}.`,
        );

        // 7. Persist in-app Notification record & Audit Log
        try {
          const recipients = await getRecipientUsers();
          const recipientUserIds = Array.from(
            new Set(recipients.map((u) => u.id)),
          );

          const notification = await this.prisma.notification.create({
            data: {
              title: 'Material Issue Overdue',
              message: `Indent #${indent.indentNumber} has ${totalRemaining} material items/quantities still pending after 48 hours in Stores processing.`,
              eventType: CommunicationEventType.MATERIAL_ISSUE_OVERDUE,
              type: 'WARNING',
              priority: 'HIGH',
              referenceId: indent.id,
              referenceModule: 'Indent',
              createdBy: indent.createdBy,
              recipients: {
                create: recipientUserIds.map((userId) => ({
                  userId,
                  isRead: false,
                  deliveryStatus: 'DELIVERED',
                })),
              },
            },
          });

          await this.prisma.auditLog
            .create({
              data: {
                module: 'NOTIFICATIONS',
                recordId: notification.id,
                action: 'CREATE',
                performedBy: indent.createdBy,
                newValue: {
                  message: `48-hour overdue material issue alert triggered for Indent #${indent.indentNumber}`,
                  indentId: indent.id,
                },
              },
            })
            .catch(() => {});
        } catch (notifErr: any) {
          this.logger.warn(
            `Failed to persist in-app notification for Indent #${indent.indentNumber}: ${notifErr?.message}`,
          );
        }

        existingAlertSet.add(indent.id);

        const payload = {
          indentId: indent.id,
          indentNumber: indent.indentNumber,
          productName: indent.product?.productName || 'Unknown',
          storesProcessingStartedAt: new Date(movedAt).toLocaleString(),
          overdueSince: new Date(
            new Date(movedAt).getTime() + FORTY_EIGHT_HOURS_MS,
          ).toLocaleString(),
          outstandingMaterials,
          totalRemaining,
          transactionUrl,
          referenceId: indent.id,
          referenceModule: 'Indent',
          targetState: WorkflowState.STORES_PROCESSING + '_OVERDUE',
        };

        this.communicationEventBus.emit(
          CommunicationEventType.MATERIAL_ISSUE_OVERDUE,
          payload,
        );
        alertedCount++;
      }

      return { processedCount: indents.length, alertedCount };
    } catch (error: any) {
      this.logger.error('Error in OverdueMaterialScheduler', error?.stack);
      return {
        processedCount: 0,
        alertedCount: 0,
        skippedReason: `ERROR: ${error?.message || 'UNKNOWN'}`,
      };
    } finally {
      if (distributedLockValue) {
        await this.releaseDistributedLock(
          OVERDUE_SCHEDULER_LOCK_KEY,
          distributedLockValue,
        );
      }
      this.isProcessing = false;
    }
  }

  /**
   * Acquire a distributed lock via application_settings table.
   * Auto-expires after lockTimeoutMs if an instance crashes while holding the lock.
   */
  private async acquireDistributedLock(
    lockKey: string,
    lockTimeoutMs: number,
  ): Promise<string | null> {
    const nowMs = Date.now();
    const lockValue = nowMs.toString();
    const expiryThreshold = nowMs - lockTimeoutMs;

    try {
      // 1. Ensure lock setting exists (upsert without changing value if exists)
      await this.prisma.applicationSetting.upsert({
        where: { key: lockKey },
        update: {},
        create: {
          key: lockKey,
          value: '0',
          category: 'SCHEDULER',
          description: 'Distributed lock for overdue material scheduler',
        },
      });

      // 2. Atomic claim using raw SQL row-level locking if executeRaw available
      if (this.prisma.$executeRaw) {
        const affected = await this.prisma.$executeRaw`
          UPDATE application_settings
          SET value = ${lockValue}, "updatedAt" = NOW()
          WHERE key = ${lockKey}
            AND (
              value = '0' 
              OR value IS NULL 
              OR CAST(COALESCE(NULLIF(value, ''), '0') AS BIGINT) < ${expiryThreshold}
            )
        `;

        if (affected > 0) {
          return lockValue;
        }
        return null;
      } else {
        // Fallback for mocked test environments
        const current = await this.prisma.applicationSetting.findUnique({
          where: { key: lockKey },
        });
        const currentVal = Number(current?.value || '0');
        if (currentVal === 0 || currentVal < expiryThreshold) {
          await this.prisma.applicationSetting.update({
            where: { key: lockKey },
            data: { value: lockValue },
          });
          return lockValue;
        }
        return null;
      }
    } catch (err: any) {
      this.logger.warn(`Failed to acquire distributed lock: ${err?.message}`);
      return null;
    }
  }

  /**
   * Release the distributed lock in application_settings if it matches this instance's lock value.
   */
  private async releaseDistributedLock(
    lockKey: string,
    lockValue: string,
  ): Promise<void> {
    try {
      if (this.prisma.$executeRaw) {
        await this.prisma.$executeRaw`
          UPDATE application_settings
          SET value = '0', "updatedAt" = NOW()
          WHERE key = ${lockKey} AND value = ${lockValue}
        `;
      } else {
        await this.prisma.applicationSetting.update({
          where: { key: lockKey },
          data: { value: '0' },
        });
      }
    } catch (err: any) {
      this.logger.warn(`Failed to release distributed lock: ${err?.message}`);
    }
  }
}
