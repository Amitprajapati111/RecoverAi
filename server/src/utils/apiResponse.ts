import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: ApiResponse['meta']
): void => {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  details?: unknown
): void => {
  const response: ApiResponse = {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  res.status(statusCode).json(response);
};

// Common error factories
export const errors = {
  notFound: (resource: string) =>
    new AppError(`${resource} not found`, 404, `${resource.toUpperCase().replace(/ /g, '_')}_NOT_FOUND`),
  unauthorized: (message = 'Unauthorized') => new AppError(message, 401, 'UNAUTHORIZED'),
  forbidden: (message = 'Forbidden') => new AppError(message, 403, 'FORBIDDEN'),
  badRequest: (message: string, code = 'BAD_REQUEST') => new AppError(message, 400, code),
  conflict: (message: string) => new AppError(message, 409, 'CONFLICT'),
  tooManyRequests: () => new AppError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED'),
  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    new AppError(message, 503, 'SERVICE_UNAVAILABLE'),
};
