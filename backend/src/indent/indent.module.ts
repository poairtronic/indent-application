import { Module } from '@nestjs/common';
import { IndentController } from './indent.controller';
import { IndentService } from './indent.service';
import { IndentRepository } from './indent.repository';

@Module({
  controllers: [IndentController],
  providers: [IndentService, IndentRepository],
  exports: [IndentService],
})
export class IndentModule {}
