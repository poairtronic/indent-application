import { environment } from '../config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId?: string;
  requestId?: string;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  duration?: number;
  payloadSize?: number;
  retryCount?: number;
  environment: string;
  metadata?: Record<string, unknown>;
}

interface RequestTelemetry {
  method: string;
  url: string;
  startTime: number;
  correlationId: string;
  requestId: string;
  attempt: number;
}

const telemetryStore = new Map<string, RequestTelemetry>();

function formatEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    `[${entry.environment}]`,
  ];
  if (entry.correlationId) parts.push(`[corr:${entry.correlationId.substring(0, 12)}]`);
  if (entry.method) parts.push(entry.method);
  if (entry.endpoint) parts.push(entry.endpoint);
  if (entry.statusCode) parts.push(`-> ${entry.statusCode}`);
  if (entry.duration !== undefined) parts.push(`${entry.duration}ms`);
  if (entry.retryCount !== undefined && entry.retryCount > 0)
    parts.push(`(retry:${entry.retryCount})`);
  parts.push(entry.message);
  return parts.join(' ');
}

function writeLog(entry: LogEntry): void {
  const formatted = formatEntry(entry);

  switch (entry.level) {
    case 'debug':
      if (environment === 'development') console.info(formatted);
      break;
    case 'info':
      if (environment === 'development') console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

export const apiLogger = {
  requestStart(telemetry: RequestTelemetry): void {
    telemetryStore.set(telemetry.requestId, telemetry);
    if (environment === 'development') {
      writeLog({
        level: 'debug',
        message: `-> ${telemetry.method} ${telemetry.url}`,
        timestamp: new Date().toISOString(),
        correlationId: telemetry.correlationId,
        requestId: telemetry.requestId,
        method: telemetry.method,
        endpoint: telemetry.url,
        environment,
        metadata: { attempt: telemetry.attempt },
      });
    }
  },

  requestEnd(requestId: string, statusCode: number, payloadSize?: number): void {
    const telemetry = telemetryStore.get(requestId);
    telemetryStore.delete(requestId);

    if (!telemetry) return;

    const duration = Date.now() - telemetry.startTime;
    const level = statusCode >= 400 ? (statusCode >= 500 ? 'error' : 'warn') : 'info';

    writeLog({
      level,
      message: `${telemetry.method} ${telemetry.url} -> ${statusCode} (${duration}ms)`,
      timestamp: new Date().toISOString(),
      correlationId: telemetry.correlationId,
      requestId,
      method: telemetry.method,
      endpoint: telemetry.url,
      statusCode,
      duration,
      payloadSize,
      retryCount: telemetry.attempt,
      environment,
    });
  },

  retryAttempt(requestId: string, attempt: number, delay: number): void {
    const telemetry = telemetryStore.get(requestId);
    writeLog({
      level: 'warn',
      message: `Retry attempt ${attempt} after ${delay}ms`,
      timestamp: new Date().toISOString(),
      correlationId: telemetry?.correlationId,
      requestId,
      method: telemetry?.method,
      endpoint: telemetry?.url,
      retryCount: attempt,
      duration: delay,
      environment,
    });
  },

  authRefresh(success: boolean): void {
    writeLog({
      level: success ? 'info' : 'warn',
      message: success ? 'Token refresh successful' : 'Token refresh failed',
      timestamp: new Date().toISOString(),
      environment,
    });
  },

  error(error: Error, correlationId?: string): void {
    writeLog({
      level: 'error',
      message: `${error.name}: ${error.message}`,
      timestamp: new Date().toISOString(),
      correlationId,
      environment,
      metadata: { stack: error.stack },
    });
  },

  debug(message: string, metadata?: Record<string, unknown>): void {
    writeLog({
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      environment,
      metadata,
    });
  },
};
