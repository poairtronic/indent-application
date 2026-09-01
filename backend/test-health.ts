import { NestFactory } from '@nestjs/core';
import { CommunicationModule } from './src/communication/communication.module';
import { CommunicationController } from './src/communication/communication.controller';
import { AppModule } from './src/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const controller = app.get(CommunicationController);
  
  console.log('Fetching Health...');
  const health = await controller.getHealth();
  console.log('Health:', health);

  await app.close();
}

bootstrap().catch(console.error);
