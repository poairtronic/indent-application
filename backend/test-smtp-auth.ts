import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { CommunicationController } from './src/communication/communication.controller';
import { NodemailerProvider } from './src/communication/providers/nodemailer.provider';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const commCtrl = app.get(CommunicationController);
  const health = await commCtrl.getHealth();
  console.log("Health Check Result:", health);
  
  const provider = app.get(NodemailerProvider);
  try {
    const result = await provider.sendEmail({
      to: 'adminairtronic@gmail.com',
      subject: 'MERC Test Delivery',
      body: 'If you are reading this, the new App Password works!'
    });
    console.log("Direct SMTP send result:", result);
  } catch (err) {
    console.error("Expected send failure:", err.message);
  }

  await app.close();
}
bootstrap();
