import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { observabilityEventBus } from './observability-event-bus';

@Injectable()
export class ApiMonitoringMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const env = process.env.NODE_ENV || 'development';
    const defaultThreshold = env === 'production' ? 250 : env === 'test' ? 500 : 1000;
    const slowThreshold = parseInt(
      process.env.SLOW_API_THRESHOLD_MS || String(defaultThreshold),
      10,
    );

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const success = statusCode >= 200 && statusCode < 400;

      // Filter out metrics logs or health checks requests to prevent pollution
      const url = req.baseUrl + req.path;
      if (url.includes('/api/observability/metrics') || url.includes('/health/')) {
        return;
      }

      observabilityEventBus.emit('api.request', {
        method: req.method,
        url,
        statusCode,
        duration,
        success,
        isSlow: duration > slowThreshold,
      });
    });

    next();
  }
}
