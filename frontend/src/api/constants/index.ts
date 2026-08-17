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
  AUTH_REFRESH: 10000,
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

export const RETRY = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  BACKOFF_FACTOR: 2,
  MAX_DELAY: 30000,
  RETRY_ON: [408, 429, 500, 502, 503, 504],
  NON_RETRYABLE: [400, 401, 403, 404, 405, 409, 422, 451],
} as const;

export const CANCELLATION = {
  STALE_REQUEST_AGE: 30000,
  CLEANUP_INTERVAL: 60000,
} as const;
