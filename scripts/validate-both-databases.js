#!/usr/bin/env node

/**
 * VALIDATE BOTH DATABASES
 * Compare table structures between production and development
 */

import postgres from 'postgres';

console.log('🔍 DATABASE VALIDATION REPORT');
console.log('=============================');

const prodUrl = process.env.DEV_DATABASE_URL; // Still points to production
const devUrl = process.env.DEV_SUP_DATABASE_URL;

if (!prodUrl || !devUrl) {
  console.log('❌ Missing database URLs');
  process.exit(1);
}

async function getTables(client, dbName) {
  try {
    const result = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    return result.map(row => row.table_name);
  } catch (error) {
    console.log(`❌ Error getting tables from ${dbName}: ${error.message}`);
    return [];
  }
}

async function getTableColumns(client, tableName) {
  try {
    const result = await client`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = ${tableName}
      ORDER BY ordinal_position
    `;
    return result;
  } catch (error) {
    return [];
  }
}

try {
  const prodClient = postgres(prodUrl, { max: 1, idle_timeout: 5 });
  const devClient = postgres(devUrl, { max: 1, idle_timeout: 5 });

  console.log('\n📊 PRODUCTION DATABASE TABLES:');
  console.log(`URL: ${prodUrl.substring(0, 50)}...`);
  const prodTables = await getTables(prodClient, 'production');
  prodTables.forEach(table => console.log(`✅ ${table}`));

  console.log('\n📊 DEVELOPMENT DATABASE TABLES:');
  console.log(`URL: ${devUrl.substring(0, 50)}...`);
  const devTables = await getTables(devClient, 'development');
  devTables.forEach(table => console.log(`✅ ${table}`));

  console.log('\n🔍 MISSING TABLES IN DEVELOPMENT:');
  const missingTables = prodTables.filter(table => !devTables.includes(table));
  if (missingTables.length === 0) {
    console.log('✅ All production tables exist in development');
  } else {
    missingTables.forEach(table => console.log(`❌ ${table}`));
  }

  console.log('\n🔍 EXTRA TABLES IN DEVELOPMENT:');
  const extraTables = devTables.filter(table => !prodTables.includes(table));
  if (extraTables.length === 0) {
    console.log('✅ No extra tables in development');
  } else {
    extraTables.forEach(table => console.log(`➕ ${table}`));
  }

  // Detailed analysis for critical tables
  console.log('\n🔍 CRITICAL TABLE ANALYSIS:');
  const criticalTables = ['alerts', 'agents', 'competitive_pricing', 'intelligence_insights', 'market_capacity'];
  
  for (const table of criticalTables) {
    if (prodTables.includes(table) && devTables.includes(table)) {
      const prodCols = await getTableColumns(prodClient, table);
      const devCols = await getTableColumns(devClient, table);
      
      console.log(`\n📋 ${table.toUpperCase()}:`);
      console.log(`  Production: ${prodCols.length} columns`);
      console.log(`  Development: ${devCols.length} columns`);
      
      // Check for missing columns
      const prodColNames = prodCols.map(col => col.column_name);
      const devColNames = devCols.map(col => col.column_name);
      const missingCols = prodColNames.filter(col => !devColNames.includes(col));
      
      if (missingCols.length > 0) {
        console.log(`  ❌ Missing in dev: ${missingCols.join(', ')}`);
      } else {
        console.log(`  ✅ All columns present`);
      }
    } else if (prodTables.includes(table)) {
      console.log(`\n❌ ${table.toUpperCase()}: Missing in development`);
    } else if (devTables.includes(table)) {
      console.log(`\n➕ ${table.toUpperCase()}: Only in development`);
    }
  }

  await prodClient.end();
  await devClient.end();

} catch (error) {
  console.log(`❌ Validation error: ${error.message}`);
  process.exit(1);
}