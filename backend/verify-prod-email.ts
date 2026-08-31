import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { CommunicationService } from './src/communication/communication.service';
import { PrismaService } from './src/prisma/prisma.service';
import { NodemailerProvider } from './src/communication/providers/nodemailer.provider';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const commService = app.get(CommunicationService);
  const prisma = app.get(PrismaService);
  const provider = app.get(NodemailerProvider);
  
  console.log("=== STEP 3: SMTP VERIFICATION ===");
  const health = await provider.verifySmtp();
  console.log("SMTP Verify Result:", health);
  
  console.log("\n=== STEP 4: SEND ONE REAL TEST EMAIL ===");
  console.log("Queueing test email via CommunicationService...");
  const result = await commService.sendEmail({
    to: 'posuppportairtronic@gmail.com',
    subject: 'MERC SMTP Production Verification',
    templateName: 'welcome',
    templateContext: { name: 'PO Support Verification User' }
  });
  
  if (!result.success || !result.jobId) {
    console.log("Failed to queue email. Result:", result);
    await app.close();
    return;
  }
  console.log("Queued with Job ID:", result.jobId);
  
  console.log("Waiting up to 30 seconds for PostgresMailWorker to process the job...");
  let job: any, log: any;
  for (let i = 0; i < 15; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    job = await prisma.emailJob.findUnique({
      where: { id: result.jobId as string }
    });
    
    log = await prisma.emailLog.findFirst({
      where: { subject: 'MERC SMTP Production Verification' },
      orderBy: { sentAt: 'desc' }
    });
    
    if (job?.status && job.status !== 'PENDING' && job.status !== 'PROCESSING') {
      break;
    }
  }
  
  console.log("\n=== STEP 5: VERIFY DATABASE STATE ===");
  console.log("Email Job Status:", job?.status);
  console.log("Email Job Error:", job?.lastError);
  console.log("Email Job Attempts:", job?.attempts);
  
  console.log("Email Log Status:", log?.status);
  console.log("Email Log Message ID:", log?.messageId);
  console.log("Email Log Recipient:", log?.to);
  
  console.log("\n=== FINISHED ===");
  await app.close();
}
bootstrap();
