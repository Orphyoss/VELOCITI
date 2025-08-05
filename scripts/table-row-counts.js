#!/usr/bin/env node

/**
 * TABLE ROW COUNTS
 * Simple table name and row count for each database
 */

import postgres from 'postgres';

console.log('📊 TABLE NAME AND ROW COUNT COMPARISON');
console.log('=======================================');

const prodUrl = process.env.DEV_DATABASE_URL; // Production
const devUrl = process.env.DEV_SUP_DATABASE_URL; // Development

try {
  const prodClient = postgres(prodUrl, { max: 1 });
  const devClient = postgres(devUrl, { max: 1 });

  // Get all tables and row counts from production
  console.log('\n🔵 PRODUCTION DATABASE:');
  console.log('========================');
  const prodTables = await prodClient`
    SELECT 
      schemaname, 
      tablename,
      n_tup_ins - n_tup_del as row_count
    FROM pg_stat_user_tables 
    ORDER BY tablename
  `;
  
  let prodTotal = 0;
  for (const table of prodTables) {
    console.log(`${table.tablename.padEnd(25)} : ${table.row_count} rows`);
    prodTotal += parseInt(table.row_count);
  }
  console.log(`\nTOTAL PRODUCTION TABLES: ${prodTables.length}`);
  console.log(`TOTAL PRODUCTION ROWS: ${prodTotal}`);

  // Get all tables and row counts from development
  console.log('\n🟢 DEVELOPMENT DATABASE:');
  console.log('=========================');
  const devTables = await devClient`
    SELECT 
      schemaname, 
      tablename,
      n_tup_ins - n_tup_del as row_count
    FROM pg_stat_user_tables 
    ORDER BY tablename
  `;
  
  let devTotal = 0;
  for (const table of devTables) {
    console.log(`${table.tablename.padEnd(25)} : ${table.row_count} rows`);
    devTotal += parseInt(table.row_count);
  }
  console.log(`\nTOTAL DEVELOPMENT TABLES: ${devTables.length}`);
  console.log(`TOTAL DEVELOPMENT ROWS: ${devTotal}`);

  // Side by side comparison
  console.log('\n📋 SIDE-BY-SIDE COMPARISON:');
  console.log('============================');
  console.log('TABLE NAME                | PRODUCTION | DEVELOPMENT');
  console.log('--------------------------|------------|------------');
  
  // Create a map of all unique table names
  const allTables = new Set();
  prodTables.forEach(t => allTables.add(t.tablename));
  devTables.forEach(t => allTables.add(t.tablename));
  
  const prodMap = {};
  const devMap = {};
  prodTables.forEach(t => prodMap[t.tablename] = t.row_count);
  devTables.forEach(t => devMap[t.tablename] = t.row_count);
  
  Array.from(allTables).sort().forEach(tableName => {
    const prodCount = prodMap[tableName] || 0;
    const devCount = devMap[tableName] || 0;
    const status = prodCount === devCount ? '✅' : '📊';
    
    console.log(`${tableName.padEnd(25)} | ${String(prodCount).padStart(10)} | ${String(devCount).padStart(11)} ${status}`);
  });

  console.log('\n🎯 SUMMARY:');
  console.log(`Production: ${prodTables.length} tables, ${prodTotal} rows`);
  console.log(`Development: ${devTables.length} tables, ${devTotal} rows`);

  await prodClient.end();
  await devClient.end();

} catch (error) {
  console.log(`❌ Comparison failed: ${error.message}`);
  process.exit(1);
}