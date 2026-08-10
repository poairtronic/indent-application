import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { correlationIdAls } from './app-logger.service';
import * as crypto from 'crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = (req.headers['x-correlation-id'] ||
      req.headers['x-request-id'] ||
      crypto.randomUUID()) as string;

    res.setHeader('x-correlation-id', correlationId);

    correlationIdAls.run(correlationId, () => {
      next();
    });
  }
}
