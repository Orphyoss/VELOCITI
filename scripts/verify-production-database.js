#!/usr/bin/env node

/**
 * VERIFY PRODUCTION DATABASE - Ensures production uses correct database
 */

import { db, client } from '../server/services/supabase.js';
import { alerts as alertsTable } from '../shared/schema.js';

console.log('🔍 PRODUCTION DATABASE VERIFICATION');
console.log('=====================================');

// Environment info
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'MISSING'}`);
console.log(`DEV_DATABASE_URL: ${process.env.DEV_DATABASE_URL ? process.env.DEV_DATABASE_URL.substring(0, 30) + '...' : 'MISSING'}`);

// Check which database contains our 182 alerts
const databases = [
  { name: 'DATABASE_URL', url: process.env.DATABASE_URL },
  { name: 'DEV_DATABASE_URL', url: process.env.DEV_DATABASE_URL }
];

for (const { name, url } of databases) {
  if (!url) {
    console.log(`❌ ${name}: Not configured`);
    continue;
  }
  
  try {
    console.log(`\n🔗 Testing ${name}:`);
    console.log(`   URL: ${url.substring(0, 50)}...`);
    
    // Create temporary client for this database
    const testClient = (await import('postgres')).default(url, {
      max: 1,
      idle_timeout: 5,
      connect_timeout: 10,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : undefined,
    });
    
    // Test connection and count alerts
    const alertCount = await testClient`SELECT COUNT(*) as count FROM alerts`;
    const agentCount = await testClient`SELECT COUNT(*) as count FROM agents`;
    
    console.log(`   ✅ Connection successful`);
    console.log(`   📊 Alerts: ${alertCount[0].count}`);
    console.log(`   👥 Agents: ${agentCount[0].count}`);
    
    // Check if this is the database with our data
    if (parseInt(alertCount[0].count) >= 180) {
      console.log(`   🎯 THIS IS THE CORRECT DATABASE (has 180+ alerts)`);
    } else if (parseInt(alertCount[0].count) === 0) {
      console.log(`   ⚠️  Empty database (0 alerts)`);
    } else {
      console.log(`   ℹ️  Database with ${alertCount[0].count} alerts`);
    }
    
    await testClient.end();
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }
}

console.log('\n📋 RECOMMENDATION:');
console.log('===================');

// Test current configuration
try {
  const currentAlerts = await client`SELECT COUNT(*) as count FROM alerts`;
  const alertCount = parseInt(currentAlerts[0].count);
  
  if (alertCount >= 180) {
    console.log('✅ Current configuration is CORRECT');
    console.log(`   Using database with ${alertCount} alerts`);
    console.log('   Production will work properly');
  } else {
    console.log('❌ Current configuration is WRONG');
    console.log(`   Using database with only ${alertCount} alerts`);
    console.log('   Production will show empty data');
    console.log('\nFIX: Ensure DATABASE_URL points to the database with 180+ alerts');
  }
} catch (error) {
  console.log('❌ Cannot test current configuration:', error.message);
}

process.exit(0);