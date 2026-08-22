const { PrismaClient } = require('@prisma/client');
const { performance } = require('perf_hooks');

const prisma = new PrismaClient();

async function run() {
  await prisma.$connect();
  console.log('Connected');
  
  // Warmup
  await prisma.department.findFirst();
  
  const id = '0b5d731e-932b-4063-bcce-3f18ba7971b3'; // use a real ID or fake one
  const currentState = 'DRAFT';
  
  const t0 = performance.now();
  try {
    await prisma.$transaction(async (tx) => {
      const t1 = performance.now();
      console.log(`BEGIN took: ${t1 - t0} ms`);
      
      const res = await tx.indent.updateMany({
        where: { id, currentState },
        data: { remarks: 'Test' }
      });
      const t2 = performance.now();
      console.log(`UPDATE took: ${t2 - t1} ms`);
      
      try {
        await tx.workflowHistory.create({
            data: { indentId: id, toDepartmentId: id, movedBy: id, remarks: 'Test' }
        });
      } catch(e) { } // it will fail FK constraints but that's fine, we want to measure time to error
      const t3 = performance.now();
      console.log(`INSERT took: ${t3 - t2} ms`);
    });
  } catch (e) {
    // ignore
  }
  const t4 = performance.now();
  console.log(`COMMIT (total) took: ${t4 - t0} ms`);
  
  process.exit(0);
}
run();
