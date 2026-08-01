import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { TemplateEngine } from './templates/template.engine';
import { RecipientResolver } from './resolver/recipient.resolver';
import { CommunicationEventBus } from './events/communication-event.bus';
import { NotificationDispatcher } from './dispatcher/notification.dispatcher';
import { QueueModule } from './queue/queue.module';

@Global()
@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [CommunicationController],
  providers: [
    CommunicationService,
    NodemailerProvider,
    TemplateEngine,
    RecipientResolver,
    CommunicationEventBus,
    NotificationDispatcher,
  ],
  exports: [CommunicationService, CommunicationEventBus, QueueModule],
})
export class CommunicationModule {}
