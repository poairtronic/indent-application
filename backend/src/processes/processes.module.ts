import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProcessesController } from './processes.controller';
import { ProcessesService } from './processes.service';


@Module({
  imports: [PrismaModule, ],
  controllers: [ProcessesController],
  providers: [ProcessesService],
  exports: [ProcessesService],
})
export class ProcessesModule {}
