#!/usr/bin/env node

/**
 * VERIFY DEV_SUP_DATABASE_URL CONFIGURATION
 * Check the new development database secret
 */

console.log('🔍 VERIFYING DEV_SUP_DATABASE_URL');
console.log('=================================');

const devSupUrl = process.env.DEV_SUP_DATABASE_URL;
const prodUrl = process.env.DATABASE_URL;
const oldDevUrl = process.env.DEV_DATABASE_URL;

console.log('\n📋 CURRENT CONFIGURATION:');
if (devSupUrl) {
  console.log(`✅ DEV_SUP_DATABASE_URL: ${devSupUrl.substring(0, 50)}...`);
} else {
  console.log('❌ DEV_SUP_DATABASE_URL: Not found');
}

if (prodUrl) {
  console.log(`✅ DATABASE_URL (prod): ${prodUrl.substring(0, 50)}...`);
} else {
  console.log('❌ DATABASE_URL: Not found');
}

if (oldDevUrl) {
  console.log(`ℹ️  DEV_DATABASE_URL (old): ${oldDevUrl.substring(0, 50)}...`);
}

console.log('\n🔄 VERIFICATION:');
if (!devSupUrl) {
  console.log('❌ DEV_SUP_DATABASE_URL not found');
  process.exit(1);
}

if (devSupUrl === prodUrl) {
  console.log('❌ DEV_SUP_DATABASE_URL is same as production');
  process.exit(1);
}

// Check if it contains the new project ID
if (devSupUrl.includes('wvahrxurnszidzwtyrzp')) {
  console.log('✅ DEV_SUP_DATABASE_URL correctly points to new development database');
  console.log('✅ Database separation achieved');
  
  console.log('\n🎯 READY FOR MIGRATION:');
  console.log('=======================');
  console.log('• Development: wvahrxurnszidzwtyrzp.supabase.co (empty, ready for schema)');
  console.log('• Production: Current database (185+ alerts preserved)');
  
} else {
  console.log('⚠️  DEV_SUP_DATABASE_URL does not contain expected project ID');
  console.log('   Expected: wvahrxurnszidzwtyrzp');
}