import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logger } from '../services/logger.js';

export const validateRequest = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('ValidationMiddleware', 'validateRequest', 'Request validation failed', {
          path: req.path,
          method: req.method,
          errors: error.errors
        });
        
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  paginationQuery: z.object({
    limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(1000)).optional(),
    offset: z.string().transform(val => parseInt(val)).pipe(z.number().min(0)).optional(),
  }),
  
  routeParams: z.object({
    route: z.string().min(1).max(20).regex(/^[A-Z]{3}-[A-Z]{3}$/, 'Route must be in format XXX-XXX')
  }),
  
  alertQuery: z.object({
    limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(1500)).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  })
};