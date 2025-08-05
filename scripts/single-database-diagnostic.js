#!/usr/bin/env node

/**
 * SINGLE DATABASE DIAGNOSTIC - Neon PostgreSQL
 * Diagnose why same DATABASE_URL works in dev but not production
 */

import { db, client } from '../server/services/supabase.js';
import { alerts as alertsTable, agents as agentsTable } from '../shared/schema.js';

console.log('🔍 SINGLE DATABASE DIAGNOSTIC');
console.log('===============================');

// Environment info
console.log('\n📋 ENVIRONMENT INFO:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('Platform:', process.platform);
console.log('Runtime:', process.version);

// Database configuration
console.log('\n🗄️ DATABASE CONFIGURATION:');
const databaseUrl = process.env.DATABASE_URL;

console.log('DATABASE_URL exists:', !!databaseUrl);
console.log('DATABASE_URL preview:', databaseUrl ? databaseUrl.substring(0, 30) + '***' : 'MISSING');

if (!databaseUrl) {
  console.log('❌ CRITICAL: Missing DATABASE_URL');
  process.exit(1);
}

// Test database connection
console.log('\n🔌 DATABASE CONNECTION TEST:');

try {
  // Test 1: Basic connection with direct PostgreSQL
  console.log('Testing basic PostgreSQL connection...');
  const connectionTest = await client`SELECT NOW() as current_time, version() as version`;
  console.log('✅ PostgreSQL connection successful');
  console.log('Server time:', connectionTest[0].current_time);
  console.log('Version:', connectionTest[0].version.split(' ')[0]);

  // Test 2: Count alerts with direct queries
  console.log('\nCounting alerts with direct SQL...');
  const alertCountDirect = await client`SELECT COUNT(*) as count FROM alerts`;
  console.log(`✅ Direct SQL: Found ${alertCountDirect[0].count} alerts`);

  // Test 3: Count alerts with Drizzle ORM
  console.log('\nCounting alerts with Drizzle ORM...');
  const alertCountDrizzle = await db.select().from(alertsTable);
  console.log(`✅ Drizzle ORM: Found ${alertCountDrizzle.length} alerts`);

  // Test 4: Fetch sample data with direct SQL
  console.log('\nFetching sample alerts with direct SQL...');
  const sampleAlertsDirect = await client`
    SELECT id, title, priority, status, created_at 
    FROM alerts 
    ORDER BY created_at DESC 
    LIMIT 3
  `;
  console.log(`✅ Direct SQL: Retrieved ${sampleAlertsDirect.length} sample alerts`);
  if (sampleAlertsDirect[0]) {
    console.log('Sample alert:', {
      id: sampleAlertsDirect[0].id.slice(0, 8) + '...',
      title: sampleAlertsDirect[0].title?.slice(0, 40) + '...',
      priority: sampleAlertsDirect[0].priority
    });
  }

  // Test 5: Fetch sample data with Drizzle ORM
  console.log('\nFetching sample alerts with Drizzle ORM...');
  const sampleAlertsDrizzle = await db.select()
    .from(alertsTable)
    .orderBy(alertsTable.created_at)
    .limit(3);
  console.log(`✅ Drizzle ORM: Retrieved ${sampleAlertsDrizzle.length} sample alerts`);

  // Test 6: Check agents table
  console.log('\nChecking agents table...');
  const agentCountDirect = await client`SELECT COUNT(*) as count FROM agents`;
  const agentCountDrizzle = await db.select().from(agentsTable);
  console.log(`✅ Direct SQL: Found ${agentCountDirect[0].count} agents`);
  console.log(`✅ Drizzle ORM: Found ${agentCountDrizzle.length} agents`);

  // Test 7: Simulate exact API call
  console.log('\n🌐 API SIMULATION TEST:');
  console.log('Simulating /api/alerts endpoint logic...');
  
  const apiSimulationDrizzle = await db.select()
    .from(alertsTable)
    .orderBy(alertsTable.created_at)
    .limit(50);
    
  console.log(`✅ API simulation (Drizzle): ${apiSimulationDrizzle.length} alerts`);
  
  const apiSimulationDirect = await client`
    SELECT * FROM alerts 
    ORDER BY created_at DESC 
    LIMIT 50
  `;
  console.log(`✅ API simulation (Direct): ${apiSimulationDirect.length} alerts`);

  // Test 8: Check table structure
  console.log('\n📋 TABLE STRUCTURE TEST:');
  const tableInfo = await client`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'alerts' 
    ORDER BY ordinal_position
  `;
  console.log('Alerts table columns:');
  tableInfo.forEach(col => {
    console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
  });

} catch (error) {
  console.log('❌ CRITICAL ERROR:', error.message);
  console.log('Error code:', error.code);
  console.log('Stack trace:', error.stack?.split('\n').slice(0, 5).join('\n'));
}

// Test 9: Check if this is a build/deployment issue
console.log('\n🏗️ BUILD CONTEXT CHECK:');
console.log('Current working directory:', process.cwd());
console.log('Script location:', import.meta.url);

// Check if we can access files that should exist
import fs from 'fs';
const checkFiles = ['package.json', 'server/index.ts', 'server/routes.ts', 'server/storage.ts'];
checkFiles.forEach(file => {
  console.log(`${file} exists:`, fs.existsSync(file));
});

console.log('\n📊 DIAGNOSTIC SUMMARY:');
console.log('========================');
console.log('Key findings:');
console.log('- Database connection type: Neon PostgreSQL (not Supabase)');
console.log('- Connection method: Direct postgres client + Drizzle ORM');
console.log('- If dev shows alerts but production returns [], the issue is likely:');
console.log('  1. Production using different DATABASE_URL');
console.log('  2. Build process not including latest storage.ts fixes');
console.log('  3. Environment variable not loading in production');
console.log('  4. TypeScript compilation issues in production build');

console.log('\n🔧 NEXT STEPS:');
console.log('1. Run: tsx scripts/single-database-diagnostic.js');
console.log('2. Test production: curl https://velociti.replit.app/api/debug');
console.log('3. Compare dev vs production outputs');
console.log('4. Check production build includes latest storage.ts changes');