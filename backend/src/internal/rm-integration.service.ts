import {
  Injectable,
  Logger,
  OnModuleInit,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

export const DEFAULT_RM_OUTBOX_CRON_SCHEDULE = '0 0 */4 * * *'; // Every 4 hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
export const RM_OUTBOX_LOCK_KEY = 'RM_OUTBOX_RETRY_LOCK';
export const RM_OUTBOX_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
export const RM_OUTBOX_MAX_ATTEMPTS = 5;

const OVERDUE_RM_OUTBOX_CRON_SCHEDULE =
  process.env.RM_OUTBOX_RETRY_CRON_SCHEDULE || DEFAULT_RM_OUTBOX_CRON_SCHEDULE;

export interface IRmOutboxRetryResult {
  retriedCount: number;
  successCount: number;
  skippedReason?: string;
}

@Injectable()
export class RmIntegrationService
  implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(RmIntegrationService.name);
  private isRetrying = false;
  private readonly inFlightSends = new Set<string>();
  private startupTimer: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private get outbox(): any {
    return (this.prisma as any).rmWebhookOutbox;
  }

  onModuleInit() {
    const rmUrl = process.env.RM_API_URL?.trim();
    const rmSecret = process.env.RM_INTERNAL_SECRET;
    const mercSecret = process.env.MERC_INTERNAL_SECRET;
    this.logger.log(`[STARTUP] RM_API_URL = "${rmUrl}"`);
    this.logger.log(`[STARTUP] RM_INTERNAL_SECRET set = ${!!rmSecret}`);
    this.logger.log(`[STARTUP] MERC_INTERNAL_SECRET set = ${!!mercSecret}`);
    if (!rmUrl) this.logger.error('[STARTUP] CRITICAL: RM_API_URL is not set!');
    if (!rmSecret)
      this.logger.error('[STARTUP] CRITICAL: RM_INTERNAL_SECRET is not set!');
  }

  public onApplicationBootstrap(): void {
    const isStartupRetryEnabled =
      process.env.RM_OUTBOX_STARTUP_RETRY_ENABLED !== 'false';
    if (isStartupRetryEnabled) {
      this.logger.log(
        'Scheduling startup RM outbox recovery check (delayed 15s)...',
      );
      this.startupTimer = setTimeout(() => {
        this.retryFailedOutbox().catch((err) => {
          this.logger.error(
            'Error during startup RM outbox recovery check',
            err?.stack,
          );
        });
      }, 15000);
    }
  }

  public onModuleDestroy(): void {
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
      this.logger.log('Cancelled pending startup RM outbox retry timer.');
    }
  }

  public getSchedulerStatus(): {
    isRetrying: boolean;
    cronSchedule: string;
    startupRetryEnabled: boolean;
  } {
    return {
      isRetrying: this.isRetrying,
      cronSchedule: OVERDUE_RM_OUTBOX_CRON_SCHEDULE,
      startupRetryEnabled:
        process.env.RM_OUTBOX_STARTUP_RETRY_ENABLED !== 'false',
    };
  }

  // Called after STORES_PROCESSING transition
  async notifyStoresPending(
    indentId: string,
    customPrisma?: any,
  ): Promise<void> {
    this.logger.log(`[RM-Outbox] Starting for indent: ${indentId}`);

    const db = customPrisma || this.prisma;

    // Step 1: Build payload
    const indent = await db.indent.findUnique({
      where: { id: indentId },
      include: {
        indentItems: {
          include: { material: true, unit: true },
          where: { isDeleted: false },
        },
        broughtMaterials: {
          where: { isDeleted: false },
        },
      },
    });

    this.logger.log(
      `[RM-Outbox-DEBUG] Indent found: ${indent?.indentNumber}, items: ${indent?.indentItems?.length ?? 0}, brought: ${(indent as any)?.broughtMaterials?.length ?? 0}`,
    );

    if (!indent) {
      this.logger.error(`[RM-Outbox] Indent not found: ${indentId}`);
      return;
    }

    // Build payload — check exact field names on material and unit models
    const payload = {
      indentId: indent.id,
      indentNumber: indent.indentNumber,
      poNumber: (indent as any).poNumber || (indent as any).purpose || null,
      customerName: indent.customerName ?? null,
      layoutNumber: indent.layoutNumber ?? null,
      mercCurrentState: (indent as any).currentState || 'DESIGN_COMPLETED',
      lineItems: [
        ...(indent.indentItems ?? []).map((item: any) => {
          let itemRemarks: any = null;
          try {
            itemRemarks = item.remarks ? JSON.parse(item.remarks) : null;
          } catch {
            itemRemarks = null;
          }

          const rawSource = item.source ?? itemRemarks?.source ?? null;
          let source: string | null = null;
          let parsedVendorName: string | null = null;

          if (rawSource) {
            if (
              typeof rawSource === 'string' &&
              rawSource.toLowerCase().startsWith('vendor')
            ) {
              source = 'Vendor';
              const clean = rawSource
                .replace(/^Vendor:\s*/i, '')
                .replace(/^Vendor\s*-\s*/i, '')
                .trim();
              if (clean && clean.toLowerCase() !== 'vendor') {
                parsedVendorName = clean;
              }
            } else if (
              typeof rawSource === 'string' &&
              rawSource.toLowerCase().includes('in-house')
            ) {
              source = 'In-house';
            } else {
              source = rawSource;
            }
          }

          const vendorName =
            item.vendor?.vendorName ||
            item.vendor?.name ||
            item.vendorName ||
            parsedVendorName ||
            null;

          const materialName =
            item.material?.materialName || item.material?.name || null;
          const itemName =
            itemRemarks?.product ||
            item.product ||
            materialName ||
            'Unknown';

          return {
            mercItemId: item.id,
            itemType: 'RAW_MATERIAL',
            name: itemName,
            material: materialName,
            shape: item.shape ?? null,
            lengthMm: item.lengthMm ? Number(item.lengthMm) : null,
            widthMm: item.widthMm ? Number(item.widthMm) : null,
            heightMm: item.heightMm ? Number(item.heightMm) : null,
            diameterMm: item.diameterMm ? Number(item.diameterMm) : null,
            quantityRequired: Number(item.quantity),
            unit: item.unit?.unitName ?? item.unit?.name ?? null,
            source: source ?? item.source ?? null,
            vendorName,
          };
        }),
        ...(indent.broughtMaterials ?? []).map((item: any) => ({
          mercItemId: item.id,
          itemType: 'BROUGHT_OUT',
          name: item.name,
          material: item.specification ?? null,
          shape: null,
          lengthMm: null,
          widthMm: null,
          heightMm: null,
          diameterMm: null,
          quantityRequired: Number(item.quantity),
          unit: null,
          source: null,
          vendorName: null,
        })),
      ],
    };

    this.logger.log(
      `[RM-Outbox] Payload built. Items: ${payload.lineItems.length}`,
    );
    this.logger.log(`[RM-Outbox] RM_API_URL: ${process.env.RM_API_URL}`);
    this.logger.log(
      `[RM-Outbox] RM_INTERNAL_SECRET set: ${!!process.env.RM_INTERNAL_SECRET}`,
    );

    // Step 2: Save to outbox first (guaranteed delivery)
    const outboxRepo = (db as any)?.rmWebhookOutbox || this.outbox;
    let outboxId: string | null = null;
    if (outboxRepo?.create) {
      const outbox = await outboxRepo.create({
        data: {
          indentId: indent.id,
          indentNumber: indent.indentNumber,
          payload: payload as any,
          status: 'PENDING',
        },
      });
      outboxId = outbox.id;
      this.logger.log(`[RM-Outbox] Saved to outbox: ${outbox.id}`);
    }

    // Step 3: Try immediate event-driven send
    if (outboxId) {
      await this.sendOutboxEntry(outboxId, payload);
    } else {
      // In case outbox wasn't created (e.g., in unit test without outbox mock)
      await this.directSend(payload);
    }
  }

  async sendOutboxEntry(outboxId: string, payload?: any): Promise<boolean> {
    // In-flight guard to prevent duplicate concurrent send of the same message
    if (this.inFlightSends.has(outboxId)) {
      this.logger.debug(
        `[RM-Outbox] Outbox entry ${outboxId} already in-flight. Skipping duplicate send.`,
      );
      return false;
    }

    this.inFlightSends.add(outboxId);

    try {
      this.logger.log(
        `[RM-Outbox-DEBUG] RM_API_URL raw value: "${process.env.RM_API_URL}"`,
      );
      this.logger.log(
        `[RM-Outbox-DEBUG] RM_INTERNAL_SECRET set: ${!!process.env.RM_INTERNAL_SECRET}`,
      );
      this.logger.debug('[RM-Outbox] Validating outbound secret');

      const rmUrl = process.env.RM_API_URL?.trim();
      const rmSecret = process.env.RM_INTERNAL_SECRET?.trim();

      if (!rmUrl || !rmSecret) {
        this.logger.error(
          '[RM-Outbox] RM_API_URL or RM_INTERNAL_SECRET missing in env',
        );
        if (this.outbox?.update) {
          await this.outbox.update({
            where: { id: outboxId },
            data: {
              status: 'FAILED',
              lastError: 'Missing env vars',
              lastAttemptAt: new Date(),
              attemptCount: { increment: 1 },
            },
          });
        }
        return false;
      }

      const entry =
        payload ??
        (await this.outbox?.findUnique({ where: { id: outboxId } }))?.payload;
      if (!entry) return false;

      const cleanUrl = rmUrl.replace(/\/+$/, '');
      const targetUrl = `${cleanUrl}/api/internal/merc/indent-pending`;
      const url = targetUrl;
      this.logger.log(`[RM-Outbox] Full target URL: ${targetUrl}`);
      this.logger.debug('[RM-Outbox] Validating outbound secret');
      this.logger.log(`[RM-Outbox] Sending to: ${url}`);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': rmSecret,
          },
          body: JSON.stringify(entry),
          signal: AbortSignal.timeout(15000),
        });

        const responseBody = await res.text();
        this.logger.log(`[RM-Outbox] Response: ${res.status} — ${responseBody}`);

        if (res.ok) {
          await this.outbox.update({
            where: { id: outboxId },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              lastAttemptAt: new Date(),
              attemptCount: { increment: 1 },
            },
          });
          this.logger.log(
            `[RM-Outbox] Successfully sent for outbox: ${outboxId}`,
          );
          return true;
        } else {
          await this.outbox.update({
            where: { id: outboxId },
            data: {
              status: 'FAILED',
              lastError: `HTTP ${res.status}: ${responseBody}`,
              lastAttemptAt: new Date(),
              attemptCount: { increment: 1 },
            },
          });
          this.logger.error(
            `[RM-Outbox] Failed HTTP ${res.status}: ${responseBody}`,
          );
          return false;
        }
      } catch (err: any) {
        const errorMsg = err?.message ?? String(err);
        this.logger.error(`[RM-Outbox] Network error: ${errorMsg}`);
        await this.outbox.update({
          where: { id: outboxId },
          data: {
            status: 'FAILED',
            lastError: errorMsg,
            lastAttemptAt: new Date(),
            attemptCount: { increment: 1 },
          },
        });
        return false;
      }
    } finally {
      this.inFlightSends.delete(outboxId);
    }
  }

  // Fallback for tests or environments where outbox table is not mocked
  private async directSend(payload: any): Promise<void> {
    const rmUrl = process.env.RM_API_URL?.trim();
    const rmSecret = process.env.RM_INTERNAL_SECRET?.trim();
    if (!rmUrl || !rmSecret) return;
    const cleanUrl = rmUrl.replace(/\/+$/, '');
    const url = `${cleanUrl}/api/internal/merc/indent-pending`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': rmSecret,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err: any) {
      this.logger.error(
        `[RM-Outbox] Direct send error: ${err?.message ?? err}`,
      );
    }
  }

  /**
   * Cron retry / recovery sweep.
   * Runs as a fallback (every 4 hours by default, configurable via RM_OUTBOX_RETRY_CRON_SCHEDULE).
   * Picks up:
   * 1. FAILED messages with attemptCount < 5
   * 2. PENDING messages older than 1 minute with attemptCount < 5
   */
  async retryFailedOutbox(): Promise<IRmOutboxRetryResult> {
    if (this.isRetrying) {
      this.logger.warn(
        '[RM-Outbox] Outbox retry sweep already in progress locally. Skipping overlapping execution.',
      );
      return {
        retriedCount: 0,
        successCount: 0,
        skippedReason: 'ALREADY_RUNNING_LOCALLY',
      };
    }

    this.isRetrying = true;
    let distributedLockValue: string | null = null;

    try {
      // 1. Cross-instance distributed lock
      distributedLockValue = await this.acquireDistributedLock(
        RM_OUTBOX_LOCK_KEY,
        RM_OUTBOX_LOCK_TIMEOUT_MS,
      );

      if (!distributedLockValue) {
        this.logger.debug(
          '[RM-Outbox] Another instance holds the retry lock. Skipping execution.',
        );
        return {
          retriedCount: 0,
          successCount: 0,
          skippedReason: 'LOCK_HELD_BY_ANOTHER_INSTANCE',
        };
      }

      const failed = await this.outbox.findMany({
        where: {
          OR: [
            { status: 'FAILED', attemptCount: { lt: RM_OUTBOX_MAX_ATTEMPTS } },
            {
              status: 'PENDING',
              createdAt: { lt: new Date(Date.now() - 60000) },
              attemptCount: { lt: RM_OUTBOX_MAX_ATTEMPTS },
            },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });

      if (!failed || failed.length === 0) {
        this.logger.debug(
          '[RM-Outbox] No eligible outbox entries requiring retry.',
        );
        return {
          retriedCount: 0,
          successCount: 0,
          skippedReason: 'NO_ELIGIBLE_ENTRIES',
        };
      }

      this.logger.log(
        `[RM-Outbox] Retrying ${failed.length} failed/pending entries`,
      );
      let successCount = 0;

      for (const entry of failed) {
        const success = await this.sendOutboxEntry(entry.id, entry.payload);
        if (success) successCount++;
      }

      return { retriedCount: failed.length, successCount };
    } catch (err: any) {
      this.logger.error(
        '[RM-Outbox] Error during retryFailedOutbox',
        err?.stack,
      );
      return {
        retriedCount: 0,
        successCount: 0,
        skippedReason: `ERROR: ${err?.message || 'UNKNOWN'}`,
      };
    } finally {
      if (distributedLockValue) {
        await this.releaseDistributedLock(
          RM_OUTBOX_LOCK_KEY,
          distributedLockValue,
        );
      }
      this.isRetrying = false;
    }
  }

  @Cron(OVERDUE_RM_OUTBOX_CRON_SCHEDULE, {
    name: 'rm-outbox-retry',
  })
  async handleOutboxRetry(): Promise<void> {
    await this.retryFailedOutbox();
  }

  async getOutboxStatus(limit = 50) {
    return this.outbox.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async acquireDistributedLock(
    lockKey: string,
    lockTimeoutMs: number,
  ): Promise<string | null> {
    const nowMs = Date.now();
    const lockValue = nowMs.toString();
    const expiryThreshold = nowMs - lockTimeoutMs;

    try {
      if (!this.prisma.applicationSetting) {
        return lockValue; // Fallback for tests without applicationSetting mock
      }

      await this.prisma.applicationSetting.upsert({
        where: { key: lockKey },
        update: {},
        create: {
          key: lockKey,
          value: '0',
          category: 'INTEGRATION',
          description: 'Distributed lock for RM outbox retry scheduler',
        },
      });

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
        if (affected > 0) return lockValue;
        return null;
      } else {
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
      this.logger.warn(`Failed to acquire RM outbox lock: ${err?.message}`);
      return null;
    }
  }

  private async releaseDistributedLock(
    lockKey: string,
    lockValue: string,
  ): Promise<void> {
    try {
      if (!this.prisma.applicationSetting) return;

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
      this.logger.warn(`Failed to release RM outbox lock: ${err?.message}`);
    }
  }
}
