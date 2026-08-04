export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
} as const;

export type ApiVersion = (typeof API_VERSIONS)[keyof typeof API_VERSIONS];

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export const TIMEOUTS = {
  DEFAULT: 30000,
  UPLOAD: 120000,
  LONG_RUNNING: 60000,
  QUICK: 10000,
} as const;

export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  TEXT: 'text/plain',
  CSV: 'text/csv',
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc',
} as const;
