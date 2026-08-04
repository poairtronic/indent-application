import type {
  PaginationParams,
  SortParams,
  FilterCondition,
  ListQueryParams,
} from '../types/query-params';
import { PAGINATION_DEFAULTS, SORT_ORDERS } from '../constants';

export function buildPaginationParams(params: PaginationParams): Required<PaginationParams> {
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULTS.PAGE);
  const limit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(1, params.limit ?? PAGINATION_DEFAULTS.LIMIT),
  );
  return { page, limit };
}

export function buildSortParams(params: SortParams): Record<string, string> {
  const result: Record<string, string> = {};
  if (params.sortBy) {
    result['sortBy'] = params.sortBy;
    result['sortOrder'] = params.sortOrder ?? SORT_ORDERS.DESC;
  }
  return result;
}

export function buildFilterParams(conditions: FilterCondition[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [index, condition] of conditions.entries()) {
    result[`filter[${index}].field`] = condition.field;
    result[`filter[${index}].operator`] = condition.operator;
    result[`filter[${index}].value`] = String(condition.value);
  }
  return result;
}

export function buildQueryParams(params: ListQueryParams): Record<string, string> {
  const queryParams: Record<string, string> = {};

  const { page, limit } = buildPaginationParams(params);
  queryParams['page'] = String(page);
  queryParams['limit'] = String(limit);

  Object.assign(queryParams, buildSortParams(params));

  if (params.filters && params.filters.length > 0) {
    Object.assign(queryParams, buildFilterParams(params.filters));
  }

  if (params.search) {
    queryParams['search'] = params.search;
  }

  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      !['page', 'limit', 'sortBy', 'sortOrder', 'filters', 'search', 'searchFields'].includes(key)
    ) {
      queryParams[key] = String(value);
    }
  }

  return queryParams;
}
