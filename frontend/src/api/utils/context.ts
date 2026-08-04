let counter = 0;

export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  counter = (counter + 1) % 1_000_000;
  return `corr_${timestamp}_${random}_${counter}`;
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export const APP_NAME = 'IMCMS';
export const CLIENT_VERSION = '20.0.0';

export function getClientTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export function getClientLocale(): string {
  try {
    return navigator.language || 'en-US';
  } catch {
    return 'en-US';
  }
}

export function createRequestContext(module?: string, action?: string) {
  return {
    requestId: generateRequestId(),
    correlationId: generateCorrelationId(),
    module,
    action,
    startTime: Date.now(),
    clientVersion: CLIENT_VERSION,
    appName: APP_NAME,
    timezone: getClientTimezone(),
    locale: getClientLocale(),
  };
}
