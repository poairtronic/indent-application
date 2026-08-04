import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { createRequestContext } from '../utils/context';
import { apiLogger } from '../utils/logger';
import {
  createDeduplicationKey,
  registerRequest,
  cancelByDeduplicationKey,
} from '../utils/cancellation';
import { environment } from '../config';

export function createRequestLogger(enableLogging: boolean) {
  return (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const ctx = createRequestContext(config.metadata?.module, config.metadata?.action);

    config.metadata = {
      ...config.metadata,
      ...ctx,
    };

    const dedupKey = createDeduplicationKey(config);
    if (dedupKey) {
      const wasCancelled = cancelByDeduplicationKey(dedupKey);
      if (wasCancelled && environment === 'development') {
        apiLogger.debug(`Cancelled duplicate request: ${config.method} ${config.url}`);
      }
    }

    if (config.signal) {
      const controller = new AbortController();
      const existingSignal = config.signal;

      if (existingSignal instanceof AbortController) {
        existingSignal.signal.addEventListener('abort', () => {
          controller.abort(existingSignal.signal.reason);
        });
      }

      if (dedupKey) {
        registerRequest(dedupKey, controller);
      }
    }

    if (enableLogging) {
      apiLogger.requestStart({
        method: config.method?.toUpperCase() ?? 'GET',
        url: config.url ?? '',
        startTime: ctx.startTime,
        correlationId: ctx.correlationId,
        requestId: ctx.requestId,
        attempt: config.metadata.attempt ?? 0,
      });
    }

    return config;
  };
}

export function createResponseLogger(enableLogging: boolean) {
  return (response: AxiosResponse): AxiosResponse => {
    const requestId = response.config.metadata?.requestId;

    if (enableLogging && requestId) {
      const contentLength = response.headers['content-length'];
      const payloadSize =
        typeof contentLength === 'string' ? parseInt(contentLength, 10) : undefined;

      apiLogger.requestEnd(requestId, response.status, payloadSize);
    }

    return response;
  };
}
