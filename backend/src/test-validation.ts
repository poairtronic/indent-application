import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ReportQueryDto } from './reports/dto/report-query.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

async function bootstrap() {
  const query = {
    page: '1',
    limit: '10',
    status: 'RAW_MATERIAL',
    sortBy: 'materialCode',
    sortOrder: 'asc',
  };
  const dto = plainToInstance(ReportQueryDto, query);
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  console.log(errors.length > 0 ? errors : 'VALID');
}
bootstrap();
