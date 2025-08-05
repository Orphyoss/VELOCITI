#!/usr/bin/env node

/**
 * VERIFY DATABASE SEPARATION
 * Check that DEV_DATABASE_URL and DATABASE_URL point to different databases
 */

console.log('🔍 DATABASE SEPARATION VERIFICATION');
console.log('===================================');

const devUrl = process.env.DEV_DATABASE_URL;
const prodUrl = process.env.DATABASE_URL;

console.log('\n📋 CURRENT CONFIGURATION:');
if (devUrl) {
  console.log(`✅ DEV_DATABASE_URL: ${devUrl.substring(0, 40)}...`);
} else {
  console.log('❌ DEV_DATABASE_URL: Not set');
}

if (prodUrl) {
  console.log(`✅ DATABASE_URL: ${prodUrl.substring(0, 40)}...`);
} else {
  console.log('❌ DATABASE_URL: Not set');
}

console.log('\n🔄 SEPARATION CHECK:');
console.log('====================');

if (!devUrl || !prodUrl) {
  console.log('❌ Cannot verify - one or both URLs missing');
  process.exit(1);
}

if (devUrl === prodUrl) {
  console.log('❌ PROBLEM: Both URLs are identical!');
  console.log('   You are still using the same database for dev and prod');
  console.log('   Please update DEV_DATABASE_URL to point to your new Supabase development database');
  process.exit(1);
}

// Extract hostnames to verify they're different
try {
  const devHost = new URL(devUrl).hostname;
  const prodHost = new URL(prodUrl).hostname;
  
  console.log(`✅ GOOD: Databases are separated`);
  console.log(`   Development: ${devHost}`);
  console.log(`   Production: ${prodHost}`);
  
  if (devHost.includes('wvahrxurnszidzwtyrzp')) {
    console.log('✅ Development database correctly points to new Supabase project');
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('==============');
  console.log('1. Run schema migration: tsx scripts/migrate-dev-database.js');
  console.log('2. Test development environment');
  console.log('3. Deploy to production when ready');
  
} catch (error) {
  console.log(`❌ URL parsing error: ${error.message}`);
  process.exit(1);
}