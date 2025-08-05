import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Get database URL from environment with proper development/production separation
const databaseUrl = process.env.NODE_ENV === 'development' 
  ? (process.env.DEV_SUP_DATABASE_URL || process.env.DATABASE_URL)
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL or DEV_DATABASE_URL environment variable is required');
}

// Log which database we're connecting to (safely)
console.log(`[Database] Connecting to: ${databaseUrl.substring(0, 30)}... (${process.env.NODE_ENV || 'development'})`);

// Log database environment info
if (process.env.NODE_ENV === 'development') {
  if (databaseUrl?.includes('wvahrxurnszidzwtyrzp')) {
    console.log('[Database] ✅ Using development database (wvahrxurnszidzwtyrzp)');
  } else {
    console.log('[Database] ⚠️  Using fallback database for development');
  }
} else {
  console.log('[Database] Using production database');
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
