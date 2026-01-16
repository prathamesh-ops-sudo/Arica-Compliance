import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface AppError extends Error {
  status?: number;
  code?: string;
  isOperational?: boolean;
}

const isProduction = process.env.NODE_ENV === 'production';

const sanitizeErrorMessage = (message: string): string => {
  const sensitivePatterns = [
    /password/gi,
    /secret/gi,
    /token/gi,
    /api[_-]?key/gi,
    /authorization/gi,
  ];
  
  let sanitized = message;
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  return sanitized;
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  const requestId = req.requestId || 'unknown';

  const logData = {
    requestId,
    code: err.code,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...(isProduction ? {} : { 
      stack: err.stack,
      body: req.body,
      query: req.query,
    }),
  };

  if (status >= 500) {
    logger.error(`[${requestId}] ${req.method} ${req.path} - ${status}: ${sanitizeErrorMessage(message)}`, logData);
  } else {
    logger.warn(`[${requestId}] ${req.method} ${req.path} - ${status}: ${message}`, logData);
  }

  const responseBody: Record<string, unknown> = {
    error: true,
    message: isProduction && status >= 500 ? 'An unexpected error occurred' : message,
    requestId,
  };

  if (err.code) {
    responseBody.code = err.code;
  }

  if (!isProduction && err.stack) {
    responseBody.stack = err.stack;
  }

  res.status(status).json(responseBody);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const requestId = req.requestId || 'unknown';
  
  logger.warn(`[${requestId}] 404 Not Found: ${req.method} ${req.path}`, {
    requestId,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  
  res.status(404).json({
    error: true,
    message: 'Resource not found',
    path: req.path,
    requestId,
  });
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
