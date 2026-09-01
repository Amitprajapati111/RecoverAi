import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  logger.error({
    message: err.message,
    stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', err.message);
    return;
  }

  // Mongoose duplicate key error
  if ((err as NodeJS.ErrnoException).code === '11000') {
    sendError(res, 'Duplicate entry', 409, 'DUPLICATE_ENTRY');
    return;
  }

  // Generic 500 in production — never leak stack trace
  sendError(
    res,
    env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    500,
    'INTERNAL_ERROR'
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND');
};
