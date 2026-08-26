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
      this.logger.error(`Prisma error: ${exception.code} - ${exception.message}`);

      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'A resource with these unique details already exists.';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'The requested resource was not found.';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Referenced resource does not exist (Foreign key violation).';
          break;
        case 'P2000':
          status = HttpStatus.BAD_REQUEST;
          message = 'Uploaded file metadata is too large for the database column.';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid data provided.';
      }
      errors = [];
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error(`Prisma validation error: ${exception.message}`);
      status = HttpStatus.BAD_REQUEST;
      message = 'Data validation failed. Please check your input.';
      errors = [];
    } else if (
      exception instanceof Prisma.PrismaClientUnknownRequestError ||
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientRustPanicError
    ) {
      this.logger.error(`Prisma severe error: ${exception.message}`);
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected database error occurred. Please try again later.';
      errors = [];
    } else if (exception instanceof Error) {
      message = exception.message || 'Internal server error';
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
