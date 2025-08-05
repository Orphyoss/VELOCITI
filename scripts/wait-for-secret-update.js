#!/usr/bin/env node

/**
 * WAIT FOR SECRET UPDATE
 * Monitor when DEV_DATABASE_URL is properly updated
 */

console.log('⏳ MONITORING SECRET UPDATE');
console.log('===========================');

let attempts = 0;
const maxAttempts = 10;

function checkSecret() {
  attempts++;
  const devUrl = process.env.DEV_DATABASE_URL;
  const prodUrl = process.env.DATABASE_URL;
  
  console.log(`\nAttempt ${attempts}/${maxAttempts}:`);
  
  if (!devUrl) {
    console.log('❌ DEV_DATABASE_URL not found');
    return false;
  }
  
  if (devUrl === prodUrl) {
    console.log('⏳ Still pointing to production database...');
    return false;
  }
  
  if (devUrl.includes('wvahrxurnszidzwtyrzp')) {
    console.log('✅ SUCCESS! DEV_DATABASE_URL updated correctly');
    console.log(`   Dev: ${devUrl.substring(0, 50)}...`);
    console.log(`   Prod: ${prodUrl.substring(0, 50)}...`);
    console.log('\n🚀 Ready to migrate schema and populate data!');
    return true;
  }
  
  console.log('❌ DEV_DATABASE_URL updated but does not contain expected project ID');
  return false;
}

const interval = setInterval(() => {
  if (checkSecret() || attempts >= maxAttempts) {
    clearInterval(interval);
    if (attempts >= maxAttempts) {
      console.log('\n⏰ Timeout reached. Please verify the secret was updated correctly.');
    }
  }
}, 2000);

// Initial check
if (!checkSecret()) {
  console.log('\n💡 Waiting for DEV_DATABASE_URL to be updated...');
  console.log('   Update the secret in Replit panel with your new Supabase connection string');
}