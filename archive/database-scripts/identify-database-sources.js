#!/usr/bin/env node

/**
 * IDENTIFY DATABASE SOURCES
 * Determine which DATABASE_URL points to PostgreSQL vs Supabase
 */

console.log('🔍 DATABASE SOURCE IDENTIFICATION');
console.log('==================================');

// Check current environment
const currentUrl = process.env.DATABASE_URL;
const devUrl = process.env.DEV_DATABASE_URL;

console.log('\n📋 CURRENT CONFIGURATION:');
console.log(`DATABASE_URL: ${currentUrl ? currentUrl.substring(0, 40) + '...' : 'MISSING'}`);
console.log(`DEV_DATABASE_URL: ${devUrl ? devUrl.substring(0, 40) + '...' : 'MISSING'}`);

// Identify database types
function identifyDatabaseType(url) {
  if (!url) return 'MISSING';
  
  if (url.includes('supabase.co')) {
    return 'SUPABASE';
  } else if (url.includes('neon.tech') || url.includes('postgres.')) {
    return 'NEON_POSTGRESQL';
  } else if (url.includes('postgresql://')) {
    return 'POSTGRESQL';
  } else {
    return 'UNKNOWN';
  }
}

console.log('\n🗄️ DATABASE TYPES:');
console.log(`DATABASE_URL type: ${identifyDatabaseType(currentUrl)}`);
console.log(`DEV_DATABASE_URL type: ${identifyDatabaseType(devUrl)}`);

// Check which has data by testing connections
async function testDatabaseConnection(url, name) {
  if (!url) {
    console.log(`❌ ${name}: No URL provided`);
    return { success: false, alerts: 0, agents: 0 };
  }
  
  try {
    const postgres = (await import('postgres')).default;
    const client = postgres(url, {
      max: 1,
      idle_timeout: 5,
      connect_timeout: 10,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : undefined,
    });
    
    const alertCount = await client`SELECT COUNT(*) as count FROM alerts`;
    const agentCount = await client`SELECT COUNT(*) as count FROM agents`;
    
    await client.end();
    
    console.log(`✅ ${name}: ${alertCount[0].count} alerts, ${agentCount[0].count} agents`);
    return { 
      success: true, 
      alerts: parseInt(alertCount[0].count), 
      agents: parseInt(agentCount[0].count) 
    };
    
  } catch (error) {
    console.log(`❌ ${name}: Connection failed - ${error.message}`);
    return { success: false, alerts: 0, agents: 0, error: error.message };
  }
}

console.log('\n🔌 TESTING CONNECTIONS:');

// Test both databases
const results = await Promise.all([
  testDatabaseConnection(currentUrl, 'DATABASE_URL'),
  testDatabaseConnection(devUrl, 'DEV_DATABASE_URL')
]);

console.log('\n📊 SUMMARY:');
console.log('============');

const [databaseResult, devResult] = results;

if (databaseResult.success && databaseResult.alerts >= 180) {
  console.log('✅ DATABASE_URL has your data (182 alerts) - USE THIS ONE');
} else if (databaseResult.success) {
  console.log(`⚠️  DATABASE_URL has ${databaseResult.alerts} alerts - might be wrong database`);
} else {
  console.log('❌ DATABASE_URL failed - cannot use this');
}

if (devResult.success && devResult.alerts >= 180) {
  console.log('✅ DEV_DATABASE_URL has your data (182 alerts) - USE THIS ONE');  
} else if (devResult.success) {
  console.log(`⚠️  DEV_DATABASE_URL has ${devResult.alerts} alerts - might be wrong database`);
} else {
  console.log('❌ DEV_DATABASE_URL failed - cannot use this');
}

console.log('\n🎯 RECOMMENDATION:');
if (databaseResult.alerts >= 180) {
  console.log('Use DATABASE_URL for production - it has your 182 alerts');
} else if (devResult.alerts >= 180) {
  console.log('DATABASE_URL is wrong! Use DEV_DATABASE_URL instead - it has your 182 alerts');
  console.log('You should either:');
  console.log('1. Delete the wrong DATABASE_URL and rename DEV_DATABASE_URL to DATABASE_URL');
  console.log('2. Or update the code to use DEV_DATABASE_URL in production');
} else {
  console.log('Neither database has your alerts - check your secrets configuration');
}