import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RmIntegrationService {
  private readonly logger = new Logger(RmIntegrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Called after STORES_PROCESSING transition
  async notifyStoresPending(indentId: string, customPrisma?: any): Promise<void> {
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

    if (!indent) {
      this.logger.error(`[RM-Outbox] Indent not found: ${indentId}`);
      return;
    }

    // Build payload — check exact field names on material and unit models
    const payload = {
      indentId: indent.id,
      indentNumber: indent.indentNumber,
      poNumber: (indent as any).poNumber ?? null,
      customerName: indent.customerName ?? null,
      layoutNumber: indent.layoutNumber ?? null,
      mercCurrentState: 'STORES_PROCESSING',
      lineItems: [
        ...(indent.indentItems ?? []).map((item: any) => ({
          mercItemId: item.id,
          itemType: 'RAW_MATERIAL',
          name: item.material?.materialName ?? item.material?.name ?? 'Unknown',
          material: item.material?.materialName ?? item.material?.name ?? null,
          shape: item.shape ?? null,
          lengthMm: item.lengthMm ? Number(item.lengthMm) : null,
          widthMm: item.widthMm ? Number(item.widthMm) : null,
          heightMm: item.heightMm ? Number(item.heightMm) : null,
          diameterMm: item.diameterMm ? Number(item.diameterMm) : null,
          quantityRequired: Number(item.quantity),
          unit: item.unit?.unitName ?? item.unit?.name ?? null,
        })),
        ...(indent.broughtMaterials ?? []).map((item: any) => ({
          mercItemId: item.id,
          itemType: 'BROUGHT_OUT',
          name: item.name,
          material: null,
          shape: null,
          lengthMm: null,
          widthMm: null,
          heightMm: null,
          diameterMm: null,
          quantityRequired: Number(item.quantity),
          unit: null,
        })),
      ],
    };

    this.logger.log(`[RM-Outbox] Payload built. Items: ${payload.lineItems.length}`);
    this.logger.log(`[RM-Outbox] RM_API_URL: ${process.env.RM_API_URL}`);
    this.logger.log(`[RM-Outbox] RM_INTERNAL_SECRET set: ${!!process.env.RM_INTERNAL_SECRET}`);

    // Step 2: Save to outbox first (guaranteed delivery)
    const outboxDb = db?.rmWebhookOutbox ? db : this.prisma;
    let outboxId: string | null = null;
    if (outboxDb?.rmWebhookOutbox?.create) {
      const outbox = await outboxDb.rmWebhookOutbox.create({
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

    // Step 3: Try immediate send
    if (outboxId) {
      await this.sendOutboxEntry(outboxId, payload);
    } else {
      // In case outbox wasn't created (e.g., in unit test without outbox mock)
      await this.directSend(payload);
    }
  }

  async sendOutboxEntry(outboxId: string, payload?: any): Promise<void> {
    const rmUrl = process.env.RM_API_URL?.trim();
    const rmSecret = process.env.RM_INTERNAL_SECRET?.trim();

    if (!rmUrl || !rmSecret) {
      this.logger.error('[RM-Outbox] RM_API_URL or RM_INTERNAL_SECRET missing in env');
      if (this.prisma?.rmWebhookOutbox?.update) {
        await this.prisma.rmWebhookOutbox.update({
          where: { id: outboxId },
          data: {
            status: 'FAILED',
            lastError: 'Missing env vars',
            lastAttemptAt: new Date(),
            attemptCount: { increment: 1 },
          },
        });
      }
      return;
    }

    const entry =
      payload ??
      (await this.prisma.rmWebhookOutbox.findUnique({ where: { id: outboxId } }))?.payload;
    if (!entry) return;

    const cleanUrl = rmUrl.replace(/\/+$/, '');
    const url = `${cleanUrl}/api/internal/merc/indent-pending`;
    this.logger.log(`[RM-Outbox] Sending to: ${url}`);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': rmSecret,
        },
        body: JSON.stringify(entry),
        // Add timeout
        signal: AbortSignal.timeout(15000),
      });

      const responseBody = await res.text();
      this.logger.log(`[RM-Outbox] Response: ${res.status} — ${responseBody}`);

      if (res.ok) {
        await this.prisma.rmWebhookOutbox.update({
          where: { id: outboxId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            lastAttemptAt: new Date(),
            attemptCount: { increment: 1 },
          },
        });
        this.logger.log(`[RM-Outbox] Successfully sent for outbox: ${outboxId}`);
      } else {
        await this.prisma.rmWebhookOutbox.update({
          where: { id: outboxId },
          data: {
            status: 'FAILED',
            lastError: `HTTP ${res.status}: ${responseBody}`,
            lastAttemptAt: new Date(),
            attemptCount: { increment: 1 },
          },
        });
        this.logger.error(`[RM-Outbox] Failed HTTP ${res.status}: ${responseBody}`);
      }
    } catch (err: any) {
      const errorMsg = err?.message ?? String(err);
      this.logger.error(`[RM-Outbox] Network error: ${errorMsg}`);
      await this.prisma.rmWebhookOutbox.update({
        where: { id: outboxId },
        data: {
          status: 'FAILED',
          lastError: errorMsg,
          lastAttemptAt: new Date(),
          attemptCount: { increment: 1 },
        },
      });
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
      this.logger.error(`[RM-Outbox] Direct send error: ${err?.message ?? err}`);
    }
  }

  // Cron retry — called every 2 minutes for FAILED entries with < 5 attempts
  async retryFailedOutbox(): Promise<void> {
    const failed = await this.prisma.rmWebhookOutbox.findMany({
      where: { status: 'FAILED', attemptCount: { lt: 5 } },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    if (failed.length > 0) {
      this.logger.log(`[RM-Outbox] Retrying ${failed.length} failed entries`);
    }

    for (const entry of failed) {
      await this.sendOutboxEntry(entry.id, entry.payload);
    }
  }

  @Cron('*/2 * * * *') // every 2 minutes
  async handleOutboxRetry(): Promise<void> {
    await this.retryFailedOutbox();
  }

  async getOutboxStatus(limit = 50) {
    return this.prisma.rmWebhookOutbox.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
