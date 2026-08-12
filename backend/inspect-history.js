const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  try {
    const id = '28ba423e-bd93-45e0-8e4f-03ca913335e0';
    
    console.log('--- WORKFLOW HISTORY ---');
    const history = await prisma.workflowHistory.findMany({
      where: { indentId: id },
      orderBy: { movedAt: 'asc' }
    });
    history.forEach((h, idx) => {
      console.log(`${idx+1}: [${h.movedAt.toISOString()}] movedBy=${h.movedBy} toDept=${h.toDepartmentId} remarks="${h.remarks}"`);
    });

    console.log('--- AUDIT LOGS ---');
    const audits = await prisma.auditLog.findMany({
      where: { recordId: id },
      orderBy: { createdAt: 'asc' }
    });
    audits.forEach((a, idx) => {
      console.log(`${idx+1}: [${a.createdAt.toISOString()}] action=${a.action} performedBy=${a.performedBy} oldVal=${JSON.stringify(a.oldValue)} newVal=${JSON.stringify(a.newValue)}`);
    });

  } catch (err) {
    console.error('Inspection Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

inspect();
