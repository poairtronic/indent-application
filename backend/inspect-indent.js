const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  try {
    const id = '28ba423e-bd93-45e0-8e4f-03ca913335e0';
    const indent = await prisma.indent.findUnique({
      where: { id },
      include: {
        costSheet: {
          include: {
            costItems: true,
            processCosts: true,
          }
        }
      }
    });

    if (!indent) {
      console.log('Indent not found!');
      return;
    }

    console.log('--- INDENT ---');
    console.log('id:', indent.id);
    console.log('indentNumber:', indent.indentNumber);
    console.log('status:', indent.status);
    console.log('currentState:', indent.currentState);
    console.log('remarks:', indent.remarks);

    console.log('--- COST SHEET ---');
    if (indent.costSheet) {
      console.log('costNumber:', indent.costSheet.costNumber);
      console.log('predictedTotal:', indent.costSheet.predictedTotal.toString());
      console.log('actualTotal:', indent.costSheet.actualTotal ? indent.costSheet.actualTotal.toString() : null);
      console.log('costItemsCount:', indent.costSheet.costItems.length);
      indent.costSheet.costItems.forEach((ci, idx) => {
        console.log(`  Item ${idx+1}: rate=${ci.predictedRate.toString()} qty=${ci.predictedQuantity.toString()} amt=${ci.predictedAmount.toString()}`);
      });
      console.log('processCostsCount:', indent.costSheet.processCosts.length);
      indent.costSheet.processCosts.forEach((pc, idx) => {
        console.log(`  Process ${idx+1}: cost=${pc.predictedCost.toString()} hrs=${pc.estimatedHours.toString()}`);
      });
    } else {
      console.log('No CostSheet linked!');
    }
  } catch (err) {
    console.error('Inspection Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

inspect();
