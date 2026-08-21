import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DocumentNumberService } from '../common/services/document-number.service';

@Global()
@Module({
  providers: [PrismaService, DocumentNumberService],
  exports: [PrismaService, DocumentNumberService],
})
export class PrismaModule {}
