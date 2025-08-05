import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// FINAL DECISION: Use DEV_SUP_DATABASE_URL as the standardized database
// This database contains all working data and proven schema
const databaseUrl = process.env.DEV_SUP_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DEV_SUP_DATABASE_URL environment variable is required');
}

// Log which database we're connecting to (safely)
console.log(`[Database] Connecting to: ${databaseUrl.substring(0, 30)}... (${process.env.NODE_ENV || 'development'})`);

// Log database environment info - FINAL CONFIGURATION
if (databaseUrl?.includes('wvahrxurnszidzwtyrzp')) {
  console.log(`[Database] ✅ Using production database (wvahrxur) for ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Database] 📊 Contains 1500+ records across all intelligence systems`);
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

// Create drizzle instance with enhanced logging
export const db = drizzle(client, { 
  schema,
  logger: {
    logQuery: (query: string, params: unknown[]) => {
      if (process.env.DEBUG_SQL) {
        console.log('[Drizzle] Query:', query);
        console.log('[Drizzle] Params:', params);
      }
    }
  }
});

// Export client for direct queries if needed
export { client };
