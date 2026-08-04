import type { AxiosRequestConfig } from 'axios';

type RequestEntry = {
  controller: AbortController;
  timestamp: number;
};

const activeRequests = new Map<string, RequestEntry>();
const routeControllers = new Map<string, AbortController>();

function getRequestKey(config: AxiosRequestConfig): string {
  const method = config.method?.toUpperCase() ?? 'GET';
  const url = config.url ?? '';
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${method}:${url}:${params}`;
}

export function createDeduplicationKey(config: AxiosRequestConfig): string | null {
  if (config.method?.toUpperCase() !== 'GET') return null;
  return getRequestKey(config);
}

export function registerRequest(key: string, controller: AbortController): void {
  const existing = activeRequests.get(key);
  if (existing) {
    existing.controller.abort('Duplicate request cancelled');
  }
  activeRequests.set(key, { controller, timestamp: Date.now() });
}

export function unregisterRequest(key: string): void {
  activeRequests.delete(key);
}

export function cancelByDeduplicationKey(key: string): boolean {
  const entry = activeRequests.get(key);
  if (entry) {
    entry.controller.abort('Duplicate request cancelled');
    activeRequests.delete(key);
    return true;
  }
  return false;
}

export function cancelRouteRequests(routeKey: string): void {
  const controller = routeControllers.get(routeKey);
  if (controller) {
    controller.abort('Route change cancelled');
    routeControllers.delete(routeKey);
  }
}

export function registerRouteController(routeKey: string, controller: AbortController): void {
  cancelRouteRequests(routeKey);
  routeControllers.set(routeKey, controller);
}

export function unregisterRouteController(routeKey: string): void {
  routeControllers.delete(routeKey);
}

export function cancelAllRequests(): void {
  for (const [key, entry] of activeRequests) {
    entry.controller.abort('All requests cancelled');
    activeRequests.delete(key);
  }
  for (const [key, controller] of routeControllers) {
    controller.abort('All requests cancelled');
    routeControllers.delete(key);
  }
}

export function getActiveRequestCount(): number {
  return activeRequests.size + routeControllers.size;
}

export function isStaleRequest(key: string, maxAge: number = 30000): boolean {
  const entry = activeRequests.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp > maxAge;
}

export function cleanupStaleRequests(maxAge: number = 60000): number {
  let cleaned = 0;
  const now = Date.now();
  for (const [key, entry] of activeRequests) {
    if (now - entry.timestamp > maxAge) {
      entry.controller.abort('Stale request cleaned up');
      activeRequests.delete(key);
      cleaned++;
    }
  }
  return cleaned;
}
