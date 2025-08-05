import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Use DEV_DATABASE_URL for both development and production
const databaseUrl = process.env.DEV_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DEV_DATABASE_URL environment variable is required');
}

// Log which database we're connecting to (safely)
console.log(`[Database] Connecting to: ${databaseUrl.substring(0, 30)}... (${process.env.NODE_ENV || 'development'})`);

// Log database environment info
if (databaseUrl?.includes('otqxixdcopnnrcnwnzmg')) {
  console.log(`[Database] ✅ Using standardized database (otqxixdc) for ${process.env.NODE_ENV || 'development'}`);
} else {
  console.log(`[Database] ⚠️  Using non-standard database for ${process.env.NODE_ENV || 'development'}`);
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
