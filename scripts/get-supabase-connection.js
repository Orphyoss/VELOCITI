#!/usr/bin/env node

/**
 * GET SUPABASE CONNECTION STRING
 * Helper to get the exact connection string for wvahrxurnszidzwtyrzp.supabase.co
 */

console.log('🔗 SUPABASE CONNECTION STRING HELPER');
console.log('====================================');

console.log('\n📋 YOUR SUPABASE PROJECT:');
console.log('Project URL: https://wvahrxurnszidzwtyrzp.supabase.co');
console.log('Project ID: wvahrxurnszidzwtyrzp');

console.log('\n🎯 GET YOUR CONNECTION STRING:');
console.log('==============================');
console.log('1. Go to: https://wvahrxurnszidzwtyrzp.supabase.co');
console.log('2. Click "Connect" (top right corner)');
console.log('3. Under "Connection string" section');
console.log('4. Click "Transaction pooler" tab');
console.log('5. Copy the connection string that looks like:');
console.log('');
console.log('   postgresql://postgres.wvahrxurnszidzwtyrzp:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres');
console.log('');
console.log('6. Replace [YOUR-PASSWORD] with your actual database password');

console.log('\n📝 UPDATE REPLIT SECRET:');
console.log('========================');
console.log('Key: DEV_DATABASE_URL');
console.log('Value: [paste the full connection string from step 6]');

console.log('\n✅ EXAMPLE:');
console.log('===========');
console.log('If your password is "myPassword123", the full string would be:');
console.log('postgresql://postgres.wvahrxurnszidzwtyrzp:myPassword123@aws-0-eu-west-2.pooler.supabase.com:6543/postgres');

console.log('\n⚠️  IMPORTANT:');
console.log('==============');
console.log('• Make sure the URL contains "wvahrxurnszidzwtyrzp"');
console.log('• Copy the entire string starting with "postgresql://"');
console.log('• Replace [YOUR-PASSWORD] with your actual password');
console.log('• No extra spaces or line breaks');

console.log('\nOnce updated, I can migrate the schema and populate with test data!');