/**
 * Safe Data Migration Script: Legacy Remarks JSON Extractor
 *
 * Extracts structured fields (customerName, layoutNumber, designCost, overheadCost,
 * contingencyCost, actualDesignCost, actualOverheadCost, actualContingencyCost)
 * from legacy JSON-encoded `indent.remarks` into dedicated relational columns.
 *
 * Idempotent: Can be run multiple times safely without corrupting or duplicating data.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function migrateLegacyRemarks() {
  console.log('[Migration] Starting legacy remarks data migration...');

  const indents = await prisma.indent.findMany({
    where: { isDeleted: false },
    include: { costSheet: true },
  });

  console.log(`[Migration] Found ${indents.length} indent records to inspect.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const indent of indents) {
    if (!indent.remarks) {
      skippedCount++;
      continue;
    }

    const rawRemarks = indent.remarks.trim();

    // Check if remarks contains JSON data
    let jsonPart = '';
    let appendedText = '';

    const firstNewline = rawRemarks.indexOf('\n');
    const verificationIndex = rawRemarks.indexOf('Stock Verification Results:');
    const actualCostIndex = rawRemarks.indexOf('[ACTUAL_COST_UPDATED]');
    const materialsIssuedIndex = rawRemarks.indexOf('[MATERIALS_ISSUED]');

    let splitIndex = -1;
    const candidates = [firstNewline, verificationIndex, actualCostIndex, materialsIssuedIndex].filter(
      (idx) => idx !== -1,
    );
    if (candidates.length > 0) {
      splitIndex = Math.min(...candidates);
    }

    if (splitIndex !== -1) {
      jsonPart = rawRemarks.substring(0, splitIndex).trim();
      appendedText = rawRemarks.substring(splitIndex).trim();
    } else {
      jsonPart = rawRemarks;
    }

    let parsed: any = null;
    try {
      if (jsonPart.startsWith('{') && jsonPart.endsWith('}')) {
        parsed = JSON.parse(jsonPart);
      }
    } catch {
      // Not valid JSON, leave remarks intact
    }

    if (!parsed || typeof parsed !== 'object') {
      skippedCount++;
      continue;
    }

    // Extract structured fields
    const customerName = parsed.customerName || indent.customerName || null;
    const layoutNumber = parsed.layoutNumber || indent.layoutNumber || null;
    const userRemarks = parsed.userRemarks || '';

    const designCost = Number(parsed.designCost) || 0;
    const overheadCost = Number(parsed.overheadCost) || 0;
    const contingencyCost = Number(parsed.contingencyCost) || 0;
    const actualDesignCost =
      parsed.actualDesignCost !== undefined && parsed.actualDesignCost !== null
        ? Number(parsed.actualDesignCost)
        : null;
    const actualOverheadCost =
      parsed.actualOverheadCost !== undefined && parsed.actualOverheadCost !== null
        ? Number(parsed.actualOverheadCost)
        : null;
    const actualContingencyCost =
      parsed.actualContingencyCost !== undefined && parsed.actualContingencyCost !== null
        ? Number(parsed.actualContingencyCost)
        : null;

    // Clean remarks: userRemarks + any appended workflow notes
    let cleanRemarks = userRemarks;
    if (appendedText) {
      cleanRemarks = cleanRemarks ? `${cleanRemarks}\n\n${appendedText}` : appendedText;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Indent structured fields and clean remarks
      await tx.indent.update({
        where: { id: indent.id },
        data: {
          customerName: customerName || undefined,
          layoutNumber: layoutNumber || undefined,
          remarks: cleanRemarks || null,
        },
      });

      // 2. Update linked CostSheet structured cost fields if costSheet exists
      if (indent.costSheet) {
        await tx.costSheet.update({
          where: { id: indent.costSheet.id },
          data: {
            designCost: designCost || undefined,
            overheadCost: overheadCost || undefined,
            contingencyCost: contingencyCost || undefined,
            actualDesignCost: actualDesignCost !== null ? actualDesignCost : undefined,
            actualOverheadCost: actualOverheadCost !== null ? actualOverheadCost : undefined,
            actualContingencyCost: actualContingencyCost !== null ? actualContingencyCost : undefined,
          },
        });
      }
    });

    migratedCount++;
    console.log(`[Migration] Migrated Indent #${indent.indentNumber}`);
  }

  console.log(
    `[Migration] Completed: ${migratedCount} records migrated to structured columns, ${skippedCount} skipped.`,
  );
}

if (require.main === module) {
  migrateLegacyRemarks()
    .catch((err) => {
      console.error('[Migration Error]:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
