#!/usr/bin/env node

/**
 * DATABASE ANALYSIS - Understand Current Setup
 * Extract database names and URLs to understand the configuration
 */

console.log('🔍 DATABASE CONFIGURATION ANALYSIS');
console.log('===================================');

function extractDatabaseInfo(url, name) {
  if (!url) {
    console.log(`❌ ${name}: No URL provided`);
    return null;
  }
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname; // This is the database name
    const dbName = pathname.substring(1); // Remove leading slash
    
    // Determine the provider
    let provider = 'Unknown';
    if (hostname.includes('supabase.co')) {
      provider = 'Supabase';
    } else if (hostname.includes('neon.tech')) {
      provider = 'Neon';
    } else if (hostname.includes('postgres')) {
      provider = 'PostgreSQL';
    }
    
    console.log(`\n📋 ${name}:`);
    console.log(`   Provider: ${provider}`);
    console.log(`   Hostname: ${hostname}`);
    console.log(`   Database Name: ${dbName || 'default'}`);
    console.log(`   Full URL: ${url.substring(0, 30)}...`);
    
    return {
      name,
      provider,
      hostname,
      dbName: dbName || 'default',
      url
    };
    
  } catch (error) {
    console.log(`❌ ${name}: Invalid URL format - ${error.message}`);
    return null;
  }
}

const devDb = extractDatabaseInfo(process.env.DEV_DATABASE_URL, 'DEV_DATABASE_URL');
const prodDb = extractDatabaseInfo(process.env.DATABASE_URL, 'DATABASE_URL');

console.log('\n🔄 COMPARISON:');
console.log('==============');

if (devDb && prodDb) {
  const sameProvider = devDb.provider === prodDb.provider;
  const sameHostname = devDb.hostname === prodDb.hostname;
  const sameDbName = devDb.dbName === prodDb.dbName;
  const sameUrl = devDb.url === prodDb.url;
  
  console.log(`Same Provider: ${sameProvider ? '✅' : '❌'} (${devDb.provider} vs ${prodDb.provider})`);
  console.log(`Same Hostname: ${sameHostname ? '✅' : '❌'}`);
  console.log(`Same Database: ${sameDbName ? '✅' : '❌'} (${devDb.dbName} vs ${prodDb.dbName})`);
  console.log(`Identical URLs: ${sameUrl ? '✅' : '❌'}`);
  
  console.log('\n🎯 RECOMMENDATION:');
  console.log('===================');
  
  if (sameUrl) {
    console.log('⚠️  PROBLEM: Both environments use the exact same database!');
    console.log('   This means:');
    console.log('   - Development changes affect production data');
    console.log('   - Testing pollutes production environment');
    console.log('   - No isolation between environments');
    console.log('');
    console.log('💡 SOLUTION: Create separate databases:');
    console.log('   - Keep DATABASE_URL for production');
    console.log('   - Create new DEV_DATABASE_URL for development');
    console.log('   - Or create separate Supabase projects');
  } else {
    console.log('✅ GOOD: You have separate databases for each environment');
    console.log('   This provides proper isolation between dev and prod');
  }
}

console.log('\n📊 CURRENT USAGE:');
console.log('==================');
console.log('Development server uses: DEV_DATABASE_URL || DATABASE_URL');
console.log('Production server uses: DATABASE_URL');
console.log('');
console.log('If both point to same database, you have shared data between environments.');