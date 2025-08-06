import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from '../services/logger.js';

// Rate limiting configurations
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for airline operations data
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('SecurityMiddleware', 'apiLimiter', 'Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter limit for sensitive endpoints
  message: {
    error: 'Rate limit exceeded for this endpoint',
    retryAfter: '15 minutes'
  },
  handler: (req, res) => {
    logger.warn('SecurityMiddleware', 'strictLimiter', 'Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'Rate limit exceeded for this endpoint',
      retryAfter: '15 minutes'
    });
  }
});

// AI/LLM specific limiter
export const llmLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Very strict for AI endpoints
  message: {
    error: 'AI request limit exceeded. Please wait before making more requests.',
    retryAfter: '10 minutes'
  }
});

// CORS configuration
export const corsOptions: cors.CorsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        /\.replit\.app$/, // Allow all Replit app domains
        /\.replit\.dev$/,  // Allow all Replit dev domains
        'https://velociti-intelligence.com', // Custom domain if deployed
      ]
    : [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        /\.replit\.dev$/ // Dev Replit domains
      ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-API-Key'
  ]
};

// Security headers with Replit-specific configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", // Needed for Vite in development
        "'unsafe-eval'", // Needed for React DevTools
        "*.replit.dev",
        "*.replit.app"
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Needed for Tailwind CSS
        "*.replit.dev",
        "*.replit.app"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:",
        "*.replit.dev",
        "*.replit.app"
      ],
      connectSrc: [
        "'self'",
        "wss:", // WebSocket connections
        "*.replit.dev",
        "*.replit.app",
        "api.openai.com",
        "api.writer.com",
        "*.pinecone.io"
      ],
      fontSrc: ["'self'", "data:", "*.replit.dev", "*.replit.app"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "*.replit.dev", "*.replit.app"],
      frameSrc: ["'none'"],
    },
    reportOnly: process.env.NODE_ENV === 'development' // Don't enforce in development
  },
  crossOriginEmbedderPolicy: false, // Disable for better compatibility
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin for Replit
});