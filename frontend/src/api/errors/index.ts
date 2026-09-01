import type { ApiErrorCode, ApiErrorInfo } from '../types/errors';
import type { ApiErrorResponse } from '../types/api-response';

const ERROR_MAP: Record<number, ApiErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
};

const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  BAD_REQUEST: 'Invalid request. Please check your input.',
  UNAUTHORIZED: 'Authentication required. Please log in.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  CONFLICT: 'A conflict occurred with the current state.',
  VALIDATION_ERROR: 'Validation failed. Please check your input.',
  UNPROCESSABLE_ENTITY: 'The request could not be processed.',
  TOO_MANY_REQUESTS: 'Too many requests. Please slow down.',
  INTERNAL_SERVER_ERROR: 'An internal error occurred. Please try again later.',
  BAD_GATEWAY: 'Bad gateway. The server is unreachable.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable.',
  UNKNOWN: 'An unexpected error occurred.',
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details: Array<{ field?: string; message: string; code?: string }>;
  readonly timestamp: string;
  readonly path?: string;

  constructor(info: ApiErrorInfo, details?: ApiErrorResponse['errors'], path?: string) {
    super(info.message);
    this.name = 'ApiError';
    this.code = info.code;
    this.status = info.status;
    this.details = Array.isArray(details) ? details : details ? [details as any] : [];
    this.timestamp = new Date().toISOString();
    this.path = path;
  }

  get isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR';
  }

  get isTimeout(): boolean {
    return this.code === 'TIMEOUT';
  }

  get isAuthError(): boolean {
    return this.code === 'UNAUTHORIZED';
  }

  get isForbidden(): boolean {
    return this.code === 'FORBIDDEN';
  }

  get isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR';
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  getFieldErrors(): Record<string, string> {
    const fieldErrors: Record<string, string> = {};
    for (const detail of this.details) {
      if (detail.field) {
        fieldErrors[detail.field] = detail.message;
      }
    }
    return fieldErrors;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      status: this.status,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      path: this.path,
    };
  }
}

export class NetworkError extends ApiError {
  constructor(message?: string) {
    super({
      code: 'NETWORK_ERROR',
      status: 0,
      message: message ?? ERROR_MESSAGES.NETWORK_ERROR,
    });
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ApiError {
  constructor(message?: string) {
    super({
      code: 'TIMEOUT',
      status: 0,
      message: message ?? ERROR_MESSAGES.TIMEOUT,
    });
    this.name = 'TimeoutError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message?: string) {
    super({
      code: 'UNAUTHORIZED',
      status: 401,
      message: message ?? ERROR_MESSAGES.UNAUTHORIZED,
    });
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message?: string) {
    super({
      code: 'FORBIDDEN',
      status: 403,
      message: message ?? ERROR_MESSAGES.FORBIDDEN,
    });
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends ApiError {
  constructor(message?: string, details?: ApiErrorResponse['errors']) {
    super(
      {
        code: 'VALIDATION_ERROR',
        status: 422,
        message: message ?? ERROR_MESSAGES.VALIDATION_ERROR,
      },
      details,
    );
    this.name = 'ValidationError';
  }
}

export class ConflictError extends ApiError {
  constructor(message?: string) {
    super({
      code: 'CONFLICT',
      status: 409,
      message: message ?? ERROR_MESSAGES.CONFLICT,
    });
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message?: string) {
    super({
      code: 'NOT_FOUND',
      status: 404,
      message: message ?? ERROR_MESSAGES.NOT_FOUND,
    });
    this.name = 'NotFoundError';
  }
}

export class ServerError extends ApiError {
  constructor(message?: string, status?: number) {
    super({
      code: 'INTERNAL_SERVER_ERROR',
      status: status ?? 500,
      message: message ?? ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
    this.name = 'ServerError';
  }
}

export function resolveErrorCode(status: number): ApiErrorCode {
  return ERROR_MAP[status] ?? 'UNKNOWN';
}

export function resolveErrorMessage(code: ApiErrorCode): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNKNOWN;
}

export function createApiError(
  status: number,
  message?: string,
  details?: ApiErrorResponse['errors'],
  path?: string,
): ApiError {
  const code = resolveErrorCode(status);
  return new ApiError(
    {
      code,
      status,
      message: message ?? resolveErrorMessage(code),
    },
    details,
    path,
  );
}
