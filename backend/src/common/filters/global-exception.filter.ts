import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resContent: any = exception.getResponse();
      message =
        typeof resContent === 'string' ? resContent : resContent.message || exception.message;
      if (typeof resContent === 'object' && resContent.message) {
        errors = Array.isArray(resContent.message) ? resContent.message : [resContent.message];
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database query exception';
      errors = [exception.message];
      this.logger.error(`Prisma error: ${exception.code} - ${exception.message}`);
    } else if (exception instanceof Error) {
      message = 'Internal server error';
      errors = [];
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`Unknown exception: ${JSON.stringify(exception)}`);
    }

    response.status(status).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
