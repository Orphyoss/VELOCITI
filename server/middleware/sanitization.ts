import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';
import { logger } from '../services/logger.js';

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // For airline data, we need to preserve specific formatting
      // Only sanitize HTML/script content, not legitimate route codes or numbers
      if (value.includes('<') || value.includes('script')) {
        const sanitized = DOMPurify.sanitize(value);
        if (sanitized !== value) {
          logger.warn('SanitizationMiddleware', 'sanitizeValue', 'Content sanitized', {
            original: value.substring(0, 100),
            sanitized: sanitized.substring(0, 100),
            path: req.path
          });
        }
        return sanitized;
      }
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };

  try {
    if (req.body) {
      req.body = sanitizeValue(req.body);
    }
    if (req.query) {
      req.query = sanitizeValue(req.query);
    }
    
    next();
  } catch (error) {
    logger.error('SanitizationMiddleware', 'sanitizeInput', 'Sanitization error', error);
    next(error);
  }
};

// Specific sanitizer for airline route codes
export const sanitizeRouteCode = (routeCode: string): string => {
  // Allow only uppercase letters and hyphens for route codes like LGW-BCN
  return routeCode.replace(/[^A-Z-]/g, '').toUpperCase();
};

// Sanitizer for numeric values (prices, percentages, etc.)
export const sanitizeNumeric = (value: string): number | null => {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};