import type { RecordType } from './types';

export function serializePayload(data: RecordType): RecordType {
  const result: RecordType = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = serializePayload(value as RecordType);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function sanitizePayload<T extends RecordType>(data: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue;
    result[key] = value;
  }
  return result as Partial<T>;
}
