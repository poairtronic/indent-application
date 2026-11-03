/* eslint-disable no-console */
import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RmIntegrationService {
  private readonly logger = new Logger(RmIntegrationService.name);

  constructor(@Optional() private readonly defaultPrisma?: PrismaService) {}

  async notifyStoresPending(
    indentId: string,
    prisma?: PrismaClient | PrismaService,
  ): Promise<void> {
    console.log('[RM-DEBUG] notifyStoresPending called for indentId:', indentId);
    console.log('[RM-DEBUG] RM_API_URL:', process.env.RM_API_URL);
    console.log('[RM-DEBUG] RM_INTERNAL_SECRET set:', !!process.env.RM_INTERNAL_SECRET);

    const db = prisma || this.defaultPrisma;
    if (!db) {
      console.warn('[RM-Integration] No Prisma client provided or available.');
      return;
    }

    try {
      const indent = await db.indent.findUnique({
        where: { id: indentId },
        include: {
          indentItems: {
            include: {
              material: true,
              unit: true,
            },
            where: { isDeleted: false },
          },
          broughtMaterials: {
            where: { isDeleted: false },
          },
        },
      });

      if (!indent) {
        console.warn(`[RM-Integration] Indent not found for ID '${indentId}' — skipping`);
        return;
      }

      const payload = {
        indentId: indent.id,
        indentNumber: indent.indentNumber,
        poNumber: (indent as any).poNumber ?? null,
        customerName: indent.customerName ?? null,
        layoutNumber: indent.layoutNumber ?? null,
        mercCurrentState: 'STORES_PROCESSING',
        lineItems: [
          // RAW_MATERIAL items
          ...indent.indentItems.map((item) => ({
            mercItemId: item.id,
            itemType: 'RAW_MATERIAL',
            name: item.material?.materialName ?? (item.material as any)?.name ?? 'Unknown',
            material: item.material?.materialName ?? (item.material as any)?.name ?? null,
            shape: item.shape ?? null,
            lengthMm: item.lengthMm ? Number(item.lengthMm) : null,
            widthMm: item.widthMm ? Number(item.widthMm) : null,
            heightMm: item.heightMm ? Number(item.heightMm) : null,
            diameterMm: item.diameterMm ? Number(item.diameterMm) : null,
            quantityRequired: Number(item.quantity),
            unit: item.unit?.unitName ?? (item.unit as any)?.name ?? null,
          })),
          // BROUGHT_OUT items
          ...((indent.broughtMaterials as any[]) || []).map((item) => ({
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

      console.log('[RM-DEBUG] Payload being sent:', JSON.stringify(payload, null, 2));

      const rmUrl = process.env.RM_API_URL;
      const rmSecret = process.env.RM_INTERNAL_SECRET;
      if (!rmUrl || !rmSecret) {
        console.warn('[RM-Integration] RM_API_URL or RM_INTERNAL_SECRET not set — skipping');
        return;
      }

      const cleanUrl = rmUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/internal/merc/indent-pending`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': rmSecret,
        },
        body: JSON.stringify(payload),
      });

      console.log('[RM-DEBUG] RM response status:', res.status);
      const responseBody = await res.text();
      console.log('[RM-DEBUG] RM response body:', responseBody);

      if (!res.ok) {
        console.error('[RM-Integration] Webhook non-OK:', res.status, responseBody);
      } else {
        console.info('[RM-Integration] RM notified for indent:', indent.indentNumber);
      }
    } catch (err: any) {
      console.error('[RM-Integration] Webhook failed — manual retry needed:', err.message);
    }
  }
}
