#!/usr/bin/env node

/**
 * CHECK PRODUCTION DATABASE ROW COUNTS
 * Get baseline numbers from production database
 */

import postgres from 'postgres';

console.log('📊 PRODUCTION DATABASE ROW COUNTS');
console.log('==================================');

// Use the old DEV_DATABASE_URL which still points to production
const prodUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL;

if (!prodUrl) {
  console.log('❌ No production database URL found');
  process.exit(1);
}

console.log(`Connecting to production: ${prodUrl.substring(0, 50)}...`);

const client = postgres(prodUrl, {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
});

try {
  // Check all main tables
  const tables = [
    'alerts',
    'agents', 
    'competitive_pricing',
    'market_capacity',
    'intelligence_insights',
    'route_performance',
    'users',
    'feedback',
    'conversations',
    'system_metrics',
    'activities'
  ];

  const counts = {};

  for (const table of tables) {
    try {
      const result = await client`SELECT COUNT(*) as count FROM ${client(table)}`;
      counts[table] = result[0].count;
      console.log(`✅ ${table}: ${result[0].count} rows`);
    } catch (error) {
      console.log(`❌ ${table}: Table not found or error`);
      counts[table] = 0;
    }
  }

  console.log('\n📋 SUMMARY:');
  console.log('===========');
  const totalRows = Object.values(counts).reduce((sum, count) => sum + parseInt(count), 0);
  console.log(`Total rows across all tables: ${totalRows}`);
  
  if (counts.alerts > 0) {
    console.log(`Main data: ${counts.alerts} alerts, ${counts.agents} agents`);
  }
  
  if (counts.competitive_pricing > 0) {
    console.log(`Competitive data: ${counts.competitive_pricing} pricing records`);
  }

  await client.end();

} catch (error) {
  console.log(`❌ Error checking production data: ${error.message}`);
  await client.end();
  process.exit(1);
}