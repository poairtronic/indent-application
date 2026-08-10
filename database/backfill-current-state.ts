import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillCurrentState() {
  console.log('Starting backfill of currentState field...');

  // Get all indents
  const indents = await prisma.indent.findMany({
    select: { id: true, status: true, remarks: true },
  });

  console.log(`Found ${indents.length} indents to backfill`);

  let updatedCount = 0;

  for (const indent of indents) {
    let currentState: string;

    switch (indent.status) {
      case 'DRAFT':
        currentState = 'DRAFT';
        break;
      case 'SUBMITTED':
        currentState = 'DESIGN_COMPLETED';
        break;
      case 'PENDING_STORES':
        // Disambiguate by remarks
        if (indent.remarks && indent.remarks.includes('[MATERIALS_ISSUED]')) {
          currentState = 'MATERIALS_ISSUED';
        } else {
          currentState = 'STORES_PROCESSING';
        }
        break;
      case 'IN_PRODUCTION':
        // Disambiguate by remarks
        if (indent.remarks && indent.remarks.includes('[PRODUCTION_COMPLETED]')) {
          currentState = 'PRODUCTION_COMPLETED';
        } else {
          currentState = 'PRODUCTION_PROCESSING';
        }
        break;
      case 'APPROVED':
        currentState = 'CUSTOMER_DELIVERED';
        break;
      case 'PENDING_ACCOUNTS':
        // Disambiguate by remarks
        if (indent.remarks && indent.remarks.includes('[ACTUAL_COST_UPDATED]')) {
          currentState = 'ACTUAL_COST_UPDATED';
        } else {
          currentState = 'ACCOUNTS_COST_VERIFICATION';
        }
        break;
      case 'PENDING_SENIOR_MANAGER':
        currentState = 'ACCOUNTS_FINANCIAL_CLOSURE';
        break;
      case 'PENDING_GENERAL_MANAGER':
        currentState = 'ARCHIVED';
        break;
      case 'COMPLETED':
        currentState = 'COMPLETED';
        break;
      case 'REJECTED':
        currentState = 'DRAFT';
        break;
      case 'CANCELLED':
        currentState = 'DRAFT';
        break;
      default:
        currentState = 'DRAFT';
    }

    await prisma.indent.update({
      where: { id: indent.id },
      data: { currentState },
    });

    updatedCount++;
  }

  console.log(`Successfully backfilled ${updatedCount} indents with currentState values`);
}

backfillCurrentState()
  .catch((e) => {
    console.error('Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
