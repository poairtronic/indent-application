import { Module } from '@nestjs/common';
import { IndentModule } from './indent/indent.module';

@Module({
  imports: [IndentModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
