#!/usr/bin/env node

/**
 * MIGRATE DEVELOPMENT DATABASE
 * Run this after updating DEV_DATABASE_URL to sync schema
 */

import { execSync } from 'child_process';

console.log('🗄️ DEVELOPMENT DATABASE MIGRATION');
console.log('==================================');

// Check if DEV_DATABASE_URL is set
if (!process.env.DEV_DATABASE_URL) {
  console.log('❌ DEV_DATABASE_URL not found!');
  console.log('   Please update your Replit secrets first with the new development database URL');
  process.exit(1);
}

// Check if DEV_DATABASE_URL is different from DATABASE_URL
if (process.env.DEV_DATABASE_URL === process.env.DATABASE_URL) {
  console.log('⚠️  WARNING: DEV_DATABASE_URL is same as DATABASE_URL!');
  console.log('   This means you\'re still using the same database for both environments');
  console.log('   Please create a separate development database first');
  process.exit(1);
}

console.log('✅ Development database URL configured separately');
console.log(`   Dev DB: ${process.env.DEV_DATABASE_URL.substring(0, 30)}...`);
console.log(`   Prod DB: ${process.env.DATABASE_URL.substring(0, 30)}...`);

try {
  console.log('\n🔄 Step 1: Generating migration files...');
  // Use DEV_DATABASE_URL for drizzle operations
  process.env.DATABASE_URL = process.env.DEV_DATABASE_URL;
  
  execSync('npx drizzle-kit generate', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DEV_DATABASE_URL }
  });
  
  console.log('\n🚀 Step 2: Applying migrations to development database...');
  execSync('npx drizzle-kit migrate', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DEV_DATABASE_URL }
  });
  
  console.log('\n✅ MIGRATION COMPLETE!');
  console.log('=======================');
  console.log('Your development database now has:');
  console.log('• All tables (alerts, agents, users, feedback, etc.)');
  console.log('• Proper schema structure');
  console.log('• Empty tables ready for test data');
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('===============');
  console.log('1. Restart your development server');
  console.log('2. Use Data Generation admin panel to populate test data');
  console.log('3. Test features safely without affecting production');
  
} catch (error) {
  console.log('\n❌ MIGRATION FAILED:');
  console.log('====================');
  console.log(error.message);
  console.log('\nTroubleshooting:');
  console.log('• Check that DEV_DATABASE_URL is correct');
  console.log('• Ensure new Supabase project is fully initialized');
  console.log('• Verify database password in connection string');
}