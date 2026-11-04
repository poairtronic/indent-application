/**
 * Utility script to trigger the RM webhook for an indent.
 *
 * Usage:
 *   node --env-file=backend/.env scripts/trigger-indent-webhook.js <indentNumber or indentId>
 *
 * Example:
 *   node --env-file=backend/.env scripts/trigger-indent-webhook.js AGIPL-IND-2026-224
 */
const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../backend/node_modules/.prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const target = process.argv[2] || 'AGIPL-IND-2026-224';
  console.log(`[Script] Looking for indent: ${target}`);

  const indent = await prisma.indent.findFirst({
    where: {
      OR: [{ id: target }, { indentNumber: target }],
    },
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
    console.error(`[Script] Indent '${target}' not found in database.`);
    process.exit(1);
  }

  console.log(`[Script] Found indent: ${indent.indentNumber} (${indent.id})`);
  console.log(`[Script] Items: ${indent.indentItems.length}, Brought out: ${indent.broughtMaterials.length}`);

  const payload = {
    indentId: indent.id,
    indentNumber: indent.indentNumber,
    poNumber: indent.poNumber ?? null,
    customerName: indent.customerName ?? null,
    layoutNumber: indent.layoutNumber ?? null,
    mercCurrentState: 'STORES_PROCESSING',
    lineItems: [
      ...indent.indentItems.map((item) => ({
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
      ...indent.broughtMaterials.map((item) => ({
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

  const rmUrl = process.env.RM_API_URL?.trim();
  const rmSecret = process.env.RM_INTERNAL_SECRET?.trim();

  console.log(`[Script] RM_API_URL: ${rmUrl}`);
  console.log(`[Script] RM_INTERNAL_SECRET configured: ${!!rmSecret}`);

  // Create outbox entry
  const outbox = await prisma.rmWebhookOutbox.create({
    data: {
      indentId: indent.id,
      indentNumber: indent.indentNumber,
      payload: payload,
      status: 'PENDING',
    },
  });
  console.log(`[Script] Outbox record created: ${outbox.id}`);

  if (!rmUrl || !rmSecret) {
    console.warn('[Script] RM_API_URL or RM_INTERNAL_SECRET not set. Entry remains in outbox as PENDING for cron retry.');
    return;
  }

  const cleanUrl = rmUrl.replace(/\/+$/, '');
  const targetEndpoint = `${cleanUrl}/api/internal/merc/indent-pending`;
  console.log(`[Script] Sending to: ${targetEndpoint}`);

  try {
    const res = await fetch(targetEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': rmSecret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const bodyText = await res.text();
    console.log(`[Script] Response status: ${res.status}`);
    console.log(`[Script] Response body: ${bodyText}`);

    if (res.ok) {
      await prisma.rmWebhookOutbox.update({
        where: { id: outbox.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          lastAttemptAt: new Date(),
          attemptCount: 1,
        },
      });
      console.log(`[Script] Successfully marked outbox ${outbox.id} as SENT!`);
    } else {
      await prisma.rmWebhookOutbox.update({
        where: { id: outbox.id },
        data: {
          status: 'FAILED',
          lastError: `HTTP ${res.status}: ${bodyText}`,
          lastAttemptAt: new Date(),
          attemptCount: 1,
        },
      });
      console.error(`[Script] Webhook returned non-OK status ${res.status}`);
    }
  } catch (err) {
    console.error(`[Script] Network error: ${err.message}`);
    await prisma.rmWebhookOutbox.update({
      where: { id: outbox.id },
      data: {
        status: 'FAILED',
        lastError: err.message,
        lastAttemptAt: new Date(),
        attemptCount: 1,
      },
    });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
