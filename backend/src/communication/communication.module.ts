import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { TemplateEngine } from './templates/template.engine';
import { RecipientResolver } from './resolver/recipient.resolver';
import { CommunicationEventBus } from './events/communication-event.bus';
import { NotificationDispatcher } from './dispatcher/notification.dispatcher';
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
                Postgres    Postgres  ],
  exports: [CommunicationService, CommunicationEventBus,  PostgresQueueService],
})
export class CommunicationModule {}
