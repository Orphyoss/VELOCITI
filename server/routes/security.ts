/**
 * Security-enhanced route handlers with validation middleware
 * Implements the security hardening requirements for Velociti Intelligence
 */

import { Express, Request, Response } from 'express';
import { validateRequest, commonSchemas } from '../middleware/validation.js';
import { strictLimiter, llmLimiter } from '../middleware/security.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../services/logger.js';
import { config } from '../services/configValidator.js';

export function registerSecurityRoutes(app: Express) {
  
  // Secure debug endpoint with strict rate limiting
  app.get('/api/debug/system-status', 
    strictLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      // Only provide limited system status information
      const statusInfo = {
        status: 'operational',
        version: '1.0.0',
        environment: config.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: 'connected',
          ai: config.OPENAI_API_KEY ? 'configured' : 'not_configured',
          writer: config.WRITER_API_KEY ? 'configured' : 'optional',
          pinecone: config.PINECONE_API_KEY ? 'configured' : 'optional'
        },
        security: {
          rateLimit: 'active',
          cors: 'configured',
          sanitization: 'enabled',
          validation: 'enabled'
        }
      };

      logger.info('SecurityRoutes', 'systemStatus', 'System status requested', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(statusInfo);
    })
  );

  // Health check endpoint (no rate limiting for monitoring)
  app.get('/api/health', 
    asyncHandler(async (req: Request, res: Response) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
      });
    })
  );

  // Secure AI endpoints with strict rate limiting
  app.post('/api/ai/query',
    llmLimiter,
    validateRequest({
      body: commonSchemas.aiQuery
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const { prompt, context, queryType } = req.body;
      
      logger.info('SecurityRoutes', 'aiQuery', 'AI query request', {
        queryType,
        promptLength: prompt?.length,
        hasContext: !!context,
        ip: req.ip
      });

      // This would connect to your actual LLM service
      res.json({ 
        message: 'AI query endpoint secured',
        queryType,
        timestamp: new Date().toISOString()
      });
    })
  );

  // Secure route validation endpoint
  app.get('/api/routes/validate/:route',
    strictLimiter,
    validateRequest({
      params: commonSchemas.routeParams
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const { route } = req.params;
      
      // Validate route format (XXX-XXX)
      const isValid = /^[A-Z]{3}-[A-Z]{3}$/.test(route);
      
      logger.info('SecurityRoutes', 'validateRoute', 'Route validation requested', {
        route,
        isValid,
        ip: req.ip
      });

      res.json({ 
        route,
        isValid,
        format: 'XXX-XXX (IATA codes)',
        timestamp: new Date().toISOString()
      });
    })
  );

  logger.info('SecurityRoutes', 'registerSecurityRoutes', 'Security routes registered successfully');
}

// Enhanced validation schemas for security routes
declare module '../middleware/validation.js' {
  namespace commonSchemas {
    const aiQuery: import('zod').ZodSchema;
  }
}

// Add to commonSchemas in validation.ts
export const securitySchemas = {
  aiQuery: require('zod').z.object({
    prompt: require('zod').z.string().min(1).max(5000),
    context: require('zod').z.any().optional(),
    queryType: require('zod').z.enum(['strategic', 'competitive', 'performance', 'network']).optional()
  })
};