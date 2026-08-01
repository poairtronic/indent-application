import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueueService } from './queue.service';
import { QueueProcessor } from './queue.processor';
import { MailWorker } from './mail.worker';
import { NodemailerProvider } from '../providers/nodemailer.provider';
import { TemplateEngine } from '../templates/template.engine';

@Module({
  imports: [PrismaModule],
  providers: [QueueService, QueueProcessor, MailWorker, NodemailerProvider, TemplateEngine],
  exports: [QueueService, QueueProcessor],
})
export class QueueModule {}
