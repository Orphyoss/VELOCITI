#!/usr/bin/env node

/**
 * COMPARE DATABASE SCHEMAS
 * Detailed comparison between production and development databases
 */

import postgres from 'postgres';

console.log('🔍 DATABASE SCHEMA COMPARISON');
console.log('=============================');

const prodUrl = process.env.DEV_DATABASE_URL; // Production (old URL)
const devUrl = process.env.DEV_SUP_DATABASE_URL; // Development (new URL)

async function getTableSchema(client, tableName) {
  try {
    const result = await client`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = ${tableName} AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    return result;
  } catch (error) {
    return [];
  }
}

async function getAllTables(client) {
  try {
    const result = await client`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    return result;
  } catch (error) {
    return [];
  }
}

try {
  const prodClient = postgres(prodUrl, { max: 1, idle_timeout: 10 });
  const devClient = postgres(devUrl, { max: 1, idle_timeout: 10 });

  console.log(`\n📊 PRODUCTION: ${prodUrl.split('@')[1].split('.')[0]}...`);
  console.log(`📊 DEVELOPMENT: ${devUrl.split('@')[1].split('.')[0]}...`);

  // Get all tables from both databases
  const [prodTables, devTables] = await Promise.all([
    getAllTables(prodClient),
    getAllTables(devClient)
  ]);

  console.log(`\n📋 TABLE COUNT COMPARISON:`);
  console.log(`Production: ${prodTables.length} tables`);
  console.log(`Development: ${devTables.length} tables`);

  // Find differences
  const prodTableNames = prodTables.map(t => t.table_name);
  const devTableNames = devTables.map(t => t.table_name);
  
  const missingInDev = prodTableNames.filter(name => !devTableNames.includes(name));
  const extraInDev = devTableNames.filter(name => !prodTableNames.includes(name));

  if (missingInDev.length > 0) {
    console.log(`\n❌ MISSING IN DEVELOPMENT (${missingInDev.length}):`);
    missingInDev.forEach(table => console.log(`  • ${table}`));
  }

  if (extraInDev.length > 0) {
    console.log(`\n➕ EXTRA IN DEVELOPMENT (${extraInDev.length}):`);
    extraInDev.forEach(table => console.log(`  • ${table}`));
  }

  // Check critical tables in detail
  const criticalTables = ['alerts', 'agents', 'competitive_pricing', 'intelligence_insights', 'market_capacity'];
  
  console.log(`\n🔍 DETAILED SCHEMA COMPARISON:`);
  
  for (const tableName of criticalTables) {
    if (prodTableNames.includes(tableName) && devTableNames.includes(tableName)) {
      const [prodSchema, devSchema] = await Promise.all([
        getTableSchema(prodClient, tableName),
        getTableSchema(devClient, tableName)
      ]);

      console.log(`\n📋 ${tableName.toUpperCase()}:`);
      console.log(`  Production: ${prodSchema.length} columns`);
      console.log(`  Development: ${devSchema.length} columns`);

      const prodColumns = prodSchema.map(col => col.column_name);
      const devColumns = devSchema.map(col => col.column_name);
      
      const missingColumns = prodColumns.filter(col => !devColumns.includes(col));
      const extraColumns = devColumns.filter(col => !prodColumns.includes(col));

      if (missingColumns.length === 0 && extraColumns.length === 0) {
        console.log(`  ✅ Perfect match - all columns present`);
      } else {
        if (missingColumns.length > 0) {
          console.log(`  ❌ Missing in dev: ${missingColumns.join(', ')}`);
        }
        if (extraColumns.length > 0) {
          console.log(`  ➕ Extra in dev: ${extraColumns.join(', ')}`);
        }
      }

      // Check data types for matching columns
      const commonColumns = prodColumns.filter(col => devColumns.includes(col));
      const typeMismatches = [];
      
      for (const colName of commonColumns) {
        const prodCol = prodSchema.find(c => c.column_name === colName);
        const devCol = devSchema.find(c => c.column_name === colName);
        
        if (prodCol.data_type !== devCol.data_type) {
          typeMismatches.push(`${colName}: ${prodCol.data_type} vs ${devCol.data_type}`);
        }
      }

      if (typeMismatches.length > 0) {
        console.log(`  ⚠️ Type mismatches: ${typeMismatches.join(', ')}`);
      }
    }
  }

  // Row count comparison for existing tables
  console.log(`\n📊 DATA COUNT COMPARISON:`);
  const commonTables = prodTableNames.filter(name => devTableNames.includes(name));
  
  for (const tableName of commonTables.slice(0, 10)) { // Limit to first 10 for readability
    try {
      const [prodCount, devCount] = await Promise.all([
        prodClient`SELECT COUNT(*) as count FROM ${prodClient(tableName)}`,
        devClient`SELECT COUNT(*) as count FROM ${devClient(tableName)}`
      ]);
      
      const prod = parseInt(prodCount[0].count);
      const dev = parseInt(devCount[0].count);
      
      if (prod === dev) {
        console.log(`  ✅ ${tableName}: ${prod} rows (equal)`);
      } else {
        console.log(`  📊 ${tableName}: Prod=${prod}, Dev=${dev}`);
      }
    } catch (error) {
      console.log(`  ❌ ${tableName}: Error checking counts`);
    }
  }

  // Final assessment
  console.log(`\n🎯 SCHEMA EQUALITY ASSESSMENT:`);
  if (missingInDev.length === 0 && extraInDev.length === 0) {
    console.log(`✅ Table structure: EQUAL (${prodTables.length} tables in both)`);
  } else {
    console.log(`❌ Table structure: NOT EQUAL`);
    console.log(`   Missing in dev: ${missingInDev.length}`);
    console.log(`   Extra in dev: ${extraInDev.length}`);
  }

  await prodClient.end();
  await devClient.end();

} catch (error) {
  console.log(`❌ Comparison error: ${error.message}`);
  process.exit(1);
}