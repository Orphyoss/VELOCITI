#!/usr/bin/env node

/**
 * COMPLETE DATABASE COMPARISON
 * Compare tables and row counts between production and development
 */

import postgres from 'postgres';

console.log('🔍 COMPLETE DATABASE COMPARISON');
console.log('================================');

const prodUrl = process.env.DEV_DATABASE_URL; // Production (otqxixdcopnnrcnwnzmg)
const devUrl = process.env.DEV_SUP_DATABASE_URL; // Development (wvahrxurnszidzwtyrzp)

async function getTableCounts(client, dbName) {
  const tables = await client`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' ORDER BY table_name
  `;
  
  const counts = {};
  
  for (const table of tables) {
    try {
      const result = await client`SELECT COUNT(*) as count FROM ${client(table.table_name)}`;
      counts[table.table_name] = parseInt(result[0].count);
    } catch (error) {
      counts[table.table_name] = `Error: ${error.message}`;
    }
  }
  
  return { tables: tables.map(t => t.table_name), counts };
}

try {
  const prodClient = postgres(prodUrl, { max: 1, idle_timeout: 10 });
  const devClient = postgres(devUrl, { max: 1, idle_timeout: 10 });

  console.log(`\n📊 PRODUCTION: ${prodUrl.split('@')[1].split('.')[0]}...`);
  console.log(`📊 DEVELOPMENT: ${devUrl.split('@')[1].split('.')[0]}...`);

  const [prodData, devData] = await Promise.all([
    getTableCounts(prodClient, 'production'),
    getTableCounts(devClient, 'development')
  ]);

  console.log(`\n📋 TABLE COUNTS:`);
  console.log(`Production: ${prodData.tables.length} tables`);
  console.log(`Development: ${devData.tables.length} tables`);

  // Find table differences
  const missingInDev = prodData.tables.filter(t => !devData.tables.includes(t));
  const extraInDev = devData.tables.filter(t => !prodData.tables.includes(t));
  const commonTables = prodData.tables.filter(t => devData.tables.includes(t));

  if (missingInDev.length > 0) {
    console.log(`\n❌ MISSING IN DEVELOPMENT (${missingInDev.length}):`);
    missingInDev.forEach(table => {
      const prodCount = prodData.counts[table];
      console.log(`  • ${table}: ${prodCount} rows in production`);
    });
  }

  if (extraInDev.length > 0) {
    console.log(`\n➕ EXTRA IN DEVELOPMENT (${extraInDev.length}):`);
    extraInDev.forEach(table => {
      const devCount = devData.counts[table];
      console.log(`  • ${table}: ${devCount} rows`);
    });
  }

  console.log(`\n📊 ROW COUNT COMPARISON (${commonTables.length} common tables):`);
  console.log('====================================================');
  
  let equalTables = 0;
  let differentTables = 0;
  
  commonTables.forEach(table => {
    const prodCount = prodData.counts[table];
    const devCount = devData.counts[table];
    
    if (prodCount === devCount) {
      console.log(`✅ ${table.padEnd(25)}: ${prodCount} rows (equal)`);
      equalTables++;
    } else {
      console.log(`📊 ${table.padEnd(25)}: Prod=${prodCount}, Dev=${devCount}`);
      differentTables++;
    }
  });

  // Summary statistics
  console.log(`\n🎯 COMPARISON SUMMARY:`);
  console.log('=====================');
  console.log(`Common tables: ${commonTables.length}`);
  console.log(`Equal row counts: ${equalTables}`);
  console.log(`Different row counts: ${differentTables}`);
  console.log(`Missing in dev: ${missingInDev.length}`);
  console.log(`Extra in dev: ${extraInDev.length}`);

  // Critical data check
  console.log(`\n🔍 CRITICAL DATA CHECK:`);
  const criticalTables = ['alerts', 'agents', 'competitive_pricing', 'intelligence_insights'];
  
  criticalTables.forEach(table => {
    if (commonTables.includes(table)) {
      const prodCount = prodData.counts[table];
      const devCount = devData.counts[table];
      console.log(`${table}: Production=${prodCount}, Development=${devCount}`);
    } else if (prodData.tables.includes(table)) {
      console.log(`${table}: Production=${prodData.counts[table]}, Development=MISSING`);
    } else if (devData.tables.includes(table)) {
      console.log(`${table}: Production=MISSING, Development=${devData.counts[table]}`);
    }
  });

  // Final assessment
  console.log(`\n🏁 FINAL ASSESSMENT:`);
  if (missingInDev.length === 0 && extraInDev.length === 0) {
    console.log(`✅ Table structure: IDENTICAL`);
  } else {
    console.log(`⚠️ Table structure: DIFFERENT`);
  }
  
  if (equalTables === commonTables.length) {
    console.log(`✅ Row counts: ALL EQUAL`);
  } else {
    console.log(`⚠️ Row counts: ${differentTables} differences`);
  }

  await prodClient.end();
  await devClient.end();

} catch (error) {
  console.log(`❌ Comparison failed: ${error.message}`);
  process.exit(1);
}