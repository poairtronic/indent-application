import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { TemplateEngine } from './templates/template.engine';
import { RecipientResolver } from './resolver/recipient.resolver';
import { CommunicationEventBus } from './events/communication-event.bus';
import { NotificationDispatcher } from './dispatcher/notification.dispatcher';

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
  ],
  exports: [CommunicationService, CommunicationEventBus],
})
export class CommunicationModule {}
