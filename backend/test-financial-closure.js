const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { BusinessTransactionService } = require('./dist/business-transaction/services/business-transaction.service');

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(BusinessTransactionService);
  const { PrismaService } = require('./dist/prisma/prisma.service');
  const prisma = app.get(PrismaService);
  
  const admin = await prisma.user.findFirst({ where: { email: 'admin@indent.com' } });
  if (!admin) return console.log('No admin');

  let indent = await prisma.indent.findFirst({
    where: { currentState: 'ACCOUNTS_COST_VERIFICATION', isDeleted: false }
  });

  if (!indent) {
    indent = await prisma.indent.findFirst({ where: { isDeleted: false }});
    await prisma.indent.update({
      where: { id: indent.id },
      data: { currentState: 'ACCOUNTS_COST_VERIFICATION' }
    });
  }

  let cs = await prisma.costSheet.findUnique({ where: { indentId: indent.id } });
  if (!cs) {
    cs = await prisma.costSheet.create({
      data: {
        indentId: indent.id,
        costNumber: 'CS-TEST-1',
        predictedTotal: 100,
        status: 'DRAFT',
        createdBy: admin.id
      }
    });
  }

  console.log('Sending two concurrent requests to financialClosure...');
  const p1 = service.financialClosure(indent.id, admin.id, {}).catch(e => e.message);
  const p2 = service.financialClosure(indent.id, admin.id, {}).catch(e => e.message);

  const [res1, res2] = await Promise.all([p1, p2]);
  console.log('Request 1:', res1);
  console.log('Request 2:', res2);
  
  process.exit(0);
}
run();
