import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { CommunicationService } from './src/communication/communication.service';
import { PrismaService } from './src/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const commService = app.get(CommunicationService);
  const prisma = app.get(PrismaService);
  
  console.log("Queueing test email via CommunicationService...");
  const result = await commService.sendEmail({
    to: 'adminairtronic@gmail.com',
    subject: 'MERC App Password Verification',
    templateName: 'welcome',
    templateContext: { name: 'Admin User' }
  });
  
  console.log("Queued with Job ID:", result.jobId);
  
  console.log("Waiting 10 seconds for PostgresMailWorker to process the job and hit Gmail SMTP...");
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  const job = await prisma.emailJob.findUnique({
    where: { id: result.jobId as string }
  });
  
  const log = await prisma.emailLog.findFirst({
    where: { subject: 'MERC App Password Verification' },
    orderBy: { sentAt: 'desc' }
  });
  
  console.log("Email Job Status:", job?.status);
  console.log("Latest Email Log Status:", log?.status);
  console.log("Message ID:", log?.messageId);

  await app.close();
}
bootstrap();
