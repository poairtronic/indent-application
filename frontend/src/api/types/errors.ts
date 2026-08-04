export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'UNPROCESSABLE_ENTITY'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_SERVER_ERROR'
  | 'BAD_GATEWAY'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN';

export interface ApiErrorInfo {
  code: ApiErrorCode;
  status: number;
  message: string;
  details?: Array<{ field?: string; message: string; code?: string }>;
}
