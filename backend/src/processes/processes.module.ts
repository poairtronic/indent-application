import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProcessesController } from './processes.controller';
import { ProcessesService } from './processes.service';

import { RedisCacheModule } from '../redis-cache/redis-cache.module';

@Module({
  imports: [PrismaModule, RedisCacheModule],
  controllers: [ProcessesController],
  providers: [ProcessesService],
  exports: [ProcessesService],
})
export class ProcessesModule {}
