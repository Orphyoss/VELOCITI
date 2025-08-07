#!/usr/bin/env node

/**
 * SETUP DEVELOPMENT DATABASE
 * This script helps you set up a new development database with the same schema
 */

console.log('🔧 DEVELOPMENT DATABASE SETUP GUIDE');
console.log('====================================');

console.log('\n📋 STEPS TO SET UP NEW DEV DATABASE:');
console.log('=====================================');

console.log('\n1️⃣ CREATE NEW SUPABASE PROJECT:');
console.log('   • Go to https://supabase.com/dashboard');
console.log('   • Click "New Project"');
console.log('   • Name: "Velociti-Development" (or similar)');
console.log('   • Choose same region as production for consistency');
console.log('   • Wait for project creation to complete');

console.log('\n2️⃣ GET NEW DATABASE URL:');
console.log('   • In new project, click "Connect" button');
console.log('   • Copy "Connection string" under "Transaction pooler"');
console.log('   • Replace [YOUR-PASSWORD] with your database password');
console.log('   • Example: postgresql://postgres.xxx:[password]@xxx.supabase.com:6543/postgres');

console.log('\n3️⃣ UPDATE REPLIT SECRETS:');
console.log('   • Go to Replit Secrets panel');
console.log('   • Update DEV_DATABASE_URL with new development database URL');
console.log('   • Keep DATABASE_URL pointing to production (current one with 185+ alerts)');

console.log('\n4️⃣ RUN SCHEMA MIGRATION:');
console.log('   • After updating DEV_DATABASE_URL, run the following commands:');
console.log('   • npm run db:migrate    # Apply schema to new dev database');
console.log('   • npm run db:generate   # Generate fresh migration files if needed');

console.log('\n5️⃣ POPULATE DEVELOPMENT DATA:');
console.log('   • Use Data Generation feature in admin panel');
console.log('   • Or run: tsx scripts/generate-dev-data.js');
console.log('   • This creates test alerts and data for development');

console.log('\n✅ VERIFICATION:');
console.log('================');
console.log('After setup, you should have:');
console.log('• DATABASE_URL: Production database (185+ real alerts)');
console.log('• DEV_DATABASE_URL: Development database (separate test data)');
console.log('• Schema synchronized between both databases');
console.log('• Proper environment isolation');

console.log('\n⚠️  IMPORTANT NOTES:');
console.log('===================');
console.log('• Never point DEV_DATABASE_URL back to production database');
console.log('• Development database can be reset/cleared safely');
console.log('• Production database contains your real competitive intelligence');
console.log('• Always test changes in development before deploying');

console.log('\nReady to proceed? Update DEV_DATABASE_URL first, then run migrations!');