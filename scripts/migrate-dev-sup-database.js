#!/usr/bin/env node

/**
 * MIGRATE DEV_SUP_DATABASE_URL
 * Apply schema to the new development database
 */

import { execSync } from 'child_process';

console.log('🗄️ DEVELOPMENT SCHEMA MIGRATION');
console.log('================================');

const devSupUrl = process.env.DEV_SUP_DATABASE_URL;
if (!devSupUrl) {
  console.log('❌ DEV_SUP_DATABASE_URL not found');
  process.exit(1);
}

console.log(`Migrating to: ${devSupUrl.substring(0, 50)}...`);

try {
  console.log('\n🔄 Step 1: Generating migration files...');
  execSync('npx drizzle-kit generate', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: devSupUrl }
  });
  
  console.log('\n🚀 Step 2: Applying migrations to development database...');
  execSync('npx drizzle-kit migrate', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: devSupUrl }
  });
  
  console.log('\n✅ MIGRATION COMPLETE!');
  console.log('=======================');
  console.log('Development database now has:');
  console.log('• All table structures (alerts, agents, users, etc.)');
  console.log('• Empty tables ready for test data');
  console.log('• Complete schema synchronization');
  
} catch (error) {
  console.log(`❌ Migration failed: ${error.message}`);
  process.exit(1);
}