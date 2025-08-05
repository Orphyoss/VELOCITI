#!/usr/bin/env node

/**
 * UPDATE DEV DATABASE URL HELPER
 * Generates the correct connection string for new Supabase development database
 */

console.log('🔗 DEVELOPMENT DATABASE URL GENERATOR');
console.log('====================================');

const supabaseHost = 'wvahrxurnszidzwtyrzp.supabase.co';
const port = '6543';
const database = 'postgres';

console.log('\n📋 NEW DEVELOPMENT DATABASE INFO:');
console.log(`   Host: ${supabaseHost}`);
console.log(`   Port: ${port}`);
console.log(`   Database: ${database}`);

console.log('\n🔑 CONNECTION STRING FORMAT:');
console.log('============================');
console.log('You need to create this connection string in your Replit secrets:');
console.log('');
console.log('Key: DEV_DATABASE_URL');
console.log('Value: postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres');
console.log('');
console.log('Where:');
console.log('• [PROJECT_REF] = Your Supabase project reference (from project settings)');
console.log('• [YOUR_PASSWORD] = The database password you set when creating the project');

console.log('\n🎯 STEPS TO GET THE EXACT URL:');
console.log('==============================');
console.log('1. Go to your Supabase project: https://supabase.com/dashboard/project/wvahrxurnszidzwtyrzp');
console.log('2. Click "Connect" button in the top toolbar');
console.log('3. Under "Connection string" → "Transaction pooler"');
console.log('4. Copy the full postgresql:// URL');
console.log('5. Replace [YOUR-PASSWORD] with your actual database password');
console.log('6. Add this as DEV_DATABASE_URL in Replit Secrets');

console.log('\n✅ AFTER UPDATING SECRET:');
console.log('=========================');
console.log('Run these commands to migrate schema:');
console.log('• tsx scripts/migrate-dev-database.js');
console.log('• This will create all tables in your new development database');

console.log('\n⚠️  IMPORTANT:');
console.log('==============');
console.log('• Keep DATABASE_URL pointing to production (your current database with 185+ alerts)');
console.log('• Only update DEV_DATABASE_URL to point to the new development database');
console.log('• This ensures proper separation between development and production data');

console.log('\nReady to update your DEV_DATABASE_URL secret!');