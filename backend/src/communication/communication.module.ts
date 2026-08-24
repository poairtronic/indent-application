import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { TemplateEngine } from './templates/template.engine';
import { RecipientResolver } from './resolver/recipient.resolver';
import { CommunicationEventBus } from './events/communication-event.bus';
import { NotificationDispatcher } from './dispatcher/notification.dispatcher';
import { QueueService } from './queue/queue.service';
import { QueueProcessor } from './queue/queue.processor';
import { MailWorker } from './queue/mail.worker';
import { PostgresQueueService } from './queue/postgres-queue.service';
import { PostgresMailWorker } from './queue/postgres-mail.worker';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [CommunicationController],
  providers: [
    CommunicationService,
    NodemailerProvider,
    TemplateEngine,
    RecipientResolver,
    CommunicationEventBus,
    NotificationDispatcher,
    QueueService,
    QueueProcessor,
    MailWorker,
    PostgresQueueService,
    PostgresMailWorker,
  ],
  exports: [CommunicationService, CommunicationEventBus, QueueService, PostgresQueueService],
})
export class CommunicationModule {}
