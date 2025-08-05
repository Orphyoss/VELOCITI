import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Get database URL from environment with fallback logic
// Ensure both dev and production use the database with data
const databaseUrl = process.env.DATABASE_URL || process.env.DEV_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL or DEV_DATABASE_URL environment variable is required');
}

// Log which database we're connecting to (safely)
console.log(`[Database] Connecting to: ${databaseUrl.substring(0, 30)}... (${process.env.NODE_ENV || 'development'})`);

// Verify this is the database with data
if (!databaseUrl.includes('otqxixdcopnnrcnwnzmg')) {
  console.warn('⚠️  Warning: DATABASE_URL may not point to the database with 182 alerts');
  console.warn('   Expected: postgresql://postgres.otqxixdcopnnrcnwnzmg...');
  console.warn(`   Actual: ${databaseUrl.substring(0, 50)}...`);
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
