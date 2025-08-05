#!/usr/bin/env node

/**
 * CHECK SECRET UPDATE STATUS
 * Verify if DEV_DATABASE_URL was updated correctly
 */

console.log('🔍 SECRET UPDATE STATUS CHECK');
console.log('=============================');

const devUrl = process.env.DEV_DATABASE_URL;
const prodUrl = process.env.DATABASE_URL;

console.log('\n📋 CURRENT STATUS:');
if (devUrl && prodUrl) {
  console.log(`DEV_DATABASE_URL:  ${devUrl.substring(0, 50)}...`);
  console.log(`DATABASE_URL:      ${prodUrl.substring(0, 50)}...`);
  
  if (devUrl === prodUrl) {
    console.log('\n❌ ISSUE: Both URLs are identical');
    console.log('The DEV_DATABASE_URL secret was not updated properly');
    
    console.log('\n🔧 TO FIX THIS:');
    console.log('================');
    console.log('1. Go to Replit Secrets panel');
    console.log('2. Find DEV_DATABASE_URL');
    console.log('3. Update it with your new Supabase connection string');
    console.log('4. The new URL should contain "wvahrxurnszidzwtyrzp"');
    console.log('5. Format: postgresql://postgres.wvahrxurnszidzwtyrzp:[PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres');
    
  } else {
    console.log('\n✅ GOOD: URLs are different');
    
    // Check if dev URL contains the new project ID
    if (devUrl.includes('wvahrxurnszidzwtyrzp')) {
      console.log('✅ DEV_DATABASE_URL correctly points to new development database');
    } else {
      console.log('⚠️  DEV_DATABASE_URL does not contain expected project ID "wvahrxurnszidzwtyrzp"');
    }
  }
} else {
  console.log('❌ One or both environment variables are missing');
}

console.log('\n💡 REMEMBER:');
console.log('=============');
console.log('• DEV_DATABASE_URL should point to: wvahrxurnszidzwtyrzp.supabase.co');
console.log('• DATABASE_URL should point to: your production database (with 185+ alerts)');
console.log('• After updating, run the migration script again');