const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { BusinessTransactionService } = require('./dist/business-transaction/services/business-transaction.service');

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(BusinessTransactionService);
  
  const btId = '554a468e-79d6-458e-a27c-241c16590a1c';
  console.log(`Fetching BT ${btId} directly from service...`);
  
  try {
    const bt = await service.findTransactionById(btId);
    console.log('Result:', JSON.stringify(bt, null, 2).slice(0, 500));
  } catch (error) {
    console.error('Service Error:', error.message);
  }
  process.exit(0);
}
run();
