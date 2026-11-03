import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';
import { InternalSecretGuard } from '../common/guards/internal-secret.guard';
import { RmIntegrationService } from './rm-integration.service';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [CommunicationModule],
  controllers: [InternalController],
  providers: [InternalSecretGuard, InternalService, RmIntegrationService],
  exports: [InternalSecretGuard, InternalService, RmIntegrationService],
})
export class InternalModule {}
