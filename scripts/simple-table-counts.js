#!/usr/bin/env node

/**
 * SIMPLE TABLE COUNTS
 * Get table names and row counts using information_schema
 */

import postgres from 'postgres';

console.log('📊 DATABASE TABLE AND ROW COUNTS');
console.log('=================================');

const prodUrl = process.env.DEV_DATABASE_URL; // Production
const devUrl = process.env.DEV_SUP_DATABASE_URL; // Development

try {
  const prodClient = postgres(prodUrl, { max: 1 });
  const devClient = postgres(devUrl, { max: 1 });

  // Get production tables
  console.log('\n🔵 PRODUCTION DATABASE:');
  console.log('========================');
  const prodTables = await prodClient`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;
  
  const prodCounts = {};
  for (const table of prodTables) {
    try {
      const result = await prodClient.unsafe(`SELECT COUNT(*) as count FROM ${table.table_name}`);
      prodCounts[table.table_name] = parseInt(result[0].count);
      console.log(`${table.table_name.padEnd(25)} : ${result[0].count} rows`);
    } catch (error) {
      prodCounts[table.table_name] = 0;
      console.log(`${table.table_name.padEnd(25)} : ERROR`);
    }
  }

  // Get development tables
  console.log('\n🟢 DEVELOPMENT DATABASE:');
  console.log('=========================');
  const devTables = await devClient`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;
  
  const devCounts = {};
  for (const table of devTables) {
    try {
      const result = await devClient.unsafe(`SELECT COUNT(*) as count FROM ${table.table_name}`);
      devCounts[table.table_name] = parseInt(result[0].count);
      console.log(`${table.table_name.padEnd(25)} : ${result[0].count} rows`);
    } catch (error) {
      devCounts[table.table_name] = 0;
      console.log(`${table.table_name.padEnd(25)} : ERROR`);
    }
  }

  // Side by side comparison
  console.log('\n📋 SIDE-BY-SIDE COMPARISON:');
  console.log('============================');
  console.log('TABLE NAME                | PRODUCTION | DEVELOPMENT | STATUS');
  console.log('--------------------------|------------|-------------|--------');
  
  // Get all unique table names
  const allTables = new Set();
  Object.keys(prodCounts).forEach(t => allTables.add(t));
  Object.keys(devCounts).forEach(t => allTables.add(t));
  
  Array.from(allTables).sort().forEach(tableName => {
    const prodCount = prodCounts[tableName] || 0;
    const devCount = devCounts[tableName] || 0;
    let status = '✅';
    
    if (prodCount === 0 && devCount > 0) status = '🟢'; // Dev only
    else if (prodCount > 0 && devCount === 0) status = '🔵'; // Prod only
    else if (prodCount !== devCount) status = '📊'; // Different
    
    console.log(`${tableName.padEnd(25)} | ${String(prodCount).padStart(10)} | ${String(devCount).padStart(11)} | ${status}`);
  });

  // Summary
  const prodTotal = Object.values(prodCounts).reduce((a, b) => a + b, 0);
  const devTotal = Object.values(devCounts).reduce((a, b) => a + b, 0);
  
  console.log('\n🎯 SUMMARY:');
  console.log(`Production: ${Object.keys(prodCounts).length} tables, ${prodTotal} total rows`);
  console.log(`Development: ${Object.keys(devCounts).length} tables, ${devTotal} total rows`);
  console.log(`✅ = Equal, 📊 = Different counts, 🔵 = Prod only, 🟢 = Dev only`);

  await prodClient.end();
  await devClient.end();

} catch (error) {
  console.log(`❌ Table count failed: ${error.message}`);
  process.exit(1);
}