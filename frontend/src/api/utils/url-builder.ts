import type { ListQueryParams } from '../types/query-params';
import { buildQueryParams } from './query-builder';

export function buildUrl(base: string, params?: ListQueryParams): string {
  if (!params) return base;

  const queryParams = buildQueryParams(params);
  const queryString = new URLSearchParams(queryParams).toString();

  if (!queryString) return base;
  return `${base}?${queryString}`;
}

export function buildPathWithId(base: string, id: string): string {
  return `${base}/${id}`;
}

export function buildNestedPath(...segments: string[]): string {
  return segments.join('/');
}

export function appendPath(base: string, ...segments: string[]): string {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanSegments = segments.map((s) => s.replace(/^\/+|\/+$/g, ''));
  return [cleanBase, ...cleanSegments].filter(Boolean).join('/');
}
