#!/usr/bin/env node

/**
 * GET EXACT CONNECTION STRING
 * Shows exactly what to put in DEV_DATABASE_URL secret
 */

console.log('🔗 EXACT CONNECTION STRING FOR DEV_DATABASE_URL');
console.log('===============================================');

console.log('\n📋 YOUR NEW SUPABASE PROJECT:');
console.log('Project URL: https://wvahrxurnszidzwtyrzp.supabase.co');
console.log('Project ID: wvahrxurnszidzwtyrzp');

console.log('\n🎯 HOW TO GET THE EXACT STRING:');
console.log('===============================');

console.log('1. Go to: https://supabase.com/dashboard/project/wvahrxurnszidzwtyrzp');
console.log('2. Click the "Connect" button (top right)');
console.log('3. Look for "Connection string" section');
console.log('4. Under "Transaction pooler", you\'ll see something like:');
console.log('');
console.log('   postgresql://postgres.wvahrxurnszidzwtyrzp:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres');
console.log('');
console.log('5. Replace [YOUR-PASSWORD] with the actual password you set');

console.log('\n💡 EXAMPLE:');
console.log('===========');
console.log('If your password is "mySecretPassword123", then your full connection string would be:');
console.log('');
console.log('postgresql://postgres.wvahrxurnszidzwtyrzp:mySecretPassword123@aws-0-eu-west-2.pooler.supabase.com:6543/postgres');

console.log('\n📝 IN REPLIT SECRETS:');
console.log('=====================');
console.log('Key: DEV_DATABASE_URL');
console.log('Value: [paste the full connection string from step 5]');

console.log('\n⚠️  IMPORTANT:');
console.log('==============');
console.log('• Copy the ENTIRE string starting with "postgresql://"');
console.log('• Make sure to replace [YOUR-PASSWORD] with your actual password');
console.log('• Don\'t add any extra spaces or characters');
console.log('• The string should be one long line');

console.log('\nNeed help finding your password? Check your Supabase project settings!');