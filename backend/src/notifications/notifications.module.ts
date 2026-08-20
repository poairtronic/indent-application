import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { OverdueMaterialScheduler } from './overdue-material.scheduler';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [PrismaModule, CommunicationModule],
  controllers: [NotificationsController],
  providers: [OverdueMaterialScheduler],
})
export class NotificationsModule {}
