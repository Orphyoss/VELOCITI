import { z } from 'zod';
import { logger } from './logger.js';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEV_SUP_DATABASE_URL: z.string().min(1, 'DEV_SUP_DATABASE_URL is required'), // Primary database
  DATABASE_URL: z.string().optional(), // Legacy fallback
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  WRITER_API_KEY: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
  FIREWORKS_API_KEY: z.string().optional(),
  FIREWORKS_BASE_URL: z.string().optional(),
  FIREWORKS_MODEL: z.string().optional(),
  PORT: z.string().default('5000'),
  REPLIT_DB_URL: z.string().optional(), // Replit database URL
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    logger.error('ConfigValidator', 'validateEnv', 'Invalid environment configuration');
    result.error.issues.forEach(issue => {
      logger.error('ConfigValidator', 'validateEnv', `Configuration error: ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  logger.info('ConfigValidator', 'validateEnv', 'Environment configuration validated successfully', {
    nodeEnv: result.data.NODE_ENV,
    hasOpenAI: !!result.data.OPENAI_API_KEY,
    hasWriter: !!result.data.WRITER_API_KEY,
    hasPinecone: !!result.data.PINECONE_API_KEY,
    hasFireworks: !!result.data.FIREWORKS_API_KEY,
  });

  return result.data;
}

export const config = validateEnv();