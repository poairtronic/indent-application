import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { ResendProvider } from './providers/resend.provider';
import { BrevoProvider } from './providers/brevo.provider';
import { SendGridProvider } from './providers/sendgrid.provider';
import { EmailProviderFactory } from './providers/email-provider.factory';
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
    ResendProvider,
    BrevoProvider,
    SendGridProvider,
    EmailProviderFactory,
    TemplateEngine,
    RecipientResolver,
    CommunicationEventBus,
    NotificationDispatcher,
    PostgresQueueService,
    PostgresMailWorker,
  ],
  exports: [
    CommunicationService,
    CommunicationEventBus,
    PostgresQueueService,
    EmailProviderFactory,
    NodemailerProvider,
    ResendProvider,
    BrevoProvider,
    SendGridProvider,
  ],
})
export class CommunicationModule {}

