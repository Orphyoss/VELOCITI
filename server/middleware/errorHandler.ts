import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.js';
import { config } from '../services/configValidator.js';

export interface ApiError extends Error {
  status?: number;
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = error.status || error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  // Log error with context
  logger.error('ErrorHandler', 'errorHandler', 'API Error', {
    status,
    message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: config.NODE_ENV === 'development' ? error.stack : undefined
  });

  // Don't expose stack traces in production
  const response = {
    error: message,
    ...(config.NODE_ENV === 'development' && { stack: error.stack }),
    timestamp: new Date().toISOString(),
    path: req.path
  };

  res.status(status).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export class ValidationError extends Error {
  status = 400;
  isOperational = true;
  
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  status = 401;
  isOperational = true;
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends Error {
  status = 429;
  isOperational = true;
  
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}