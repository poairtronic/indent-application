import type { FilterCondition } from '../types/query-params';

export function createFilter(
  field: string,
  operator: FilterCondition['operator'],
  value: FilterCondition['value'],
): FilterCondition {
  return { field, operator, value };
}

export function eq(field: string, value: string | number | boolean): FilterCondition {
  return createFilter(field, 'eq', value);
}

export function neq(field: string, value: string | number | boolean): FilterCondition {
  return createFilter(field, 'neq', value);
}

export function gt(field: string, value: number): FilterCondition {
  return createFilter(field, 'gt', value);
}

export function gte(field: string, value: number): FilterCondition {
  return createFilter(field, 'gte', value);
}

export function lt(field: string, value: number): FilterCondition {
  return createFilter(field, 'lt', value);
}

export function lte(field: string, value: number): FilterCondition {
  return createFilter(field, 'lte', value);
}

export function contains(field: string, value: string): FilterCondition {
  return createFilter(field, 'contains', value);
}

export function startsWith(field: string, value: string): FilterCondition {
  return createFilter(field, 'startsWith', value);
}

export function endsWith(field: string, value: string): FilterCondition {
  return createFilter(field, 'endsWith', value);
}

export function inArray(field: string, values: string[]): FilterCondition {
  return createFilter(field, 'in', values);
}

export function notInArray(field: string, values: string[]): FilterCondition {
  return createFilter(field, 'nin', values);
}

export function combineFilters(...conditions: FilterCondition[]): FilterCondition[] {
  return conditions.filter(Boolean);
}
