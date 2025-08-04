import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client with production-friendly configuration
const client = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30, // Increased timeout for production
  ssl: process.env.NODE_ENV === 'production' ? 'require' : undefined,
  prepare: false, // Disable prepared statements for better compatibility
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export client for direct queries if needed
export { client };
