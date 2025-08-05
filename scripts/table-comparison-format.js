#!/usr/bin/env node

/**
 * TABLE COMPARISON FORMAT
 * Clean table format showing each table with prod and dev counts
 */

import postgres from 'postgres';

console.log('📊 TABLE COMPARISON: PRODUCTION vs DEVELOPMENT');
console.log('===============================================');

const prodUrl = process.env.DEV_DATABASE_URL; // Production
const devUrl = process.env.DEV_SUP_DATABASE_URL; // Development

try {
  const prodClient = postgres(prodUrl, { max: 1 });
  const devClient = postgres(devUrl, { max: 1 });

  // Get all table names from both databases
  const [prodTables, devTables] = await Promise.all([
    prodClient`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
    devClient`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  ]);

  // Get all unique table names
  const allTableNames = new Set();
  prodTables.forEach(t => allTableNames.add(t.table_name));
  devTables.forEach(t => allTableNames.add(t.table_name));
  const sortedTables = Array.from(allTableNames).sort();

  // Get counts for all tables
  const prodCounts = {};
  const devCounts = {};

  // Production counts
  for (const tableName of sortedTables) {
    try {
      const result = await prodClient.unsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
      prodCounts[tableName] = parseInt(result[0].count);
    } catch (error) {
      prodCounts[tableName] = '-';
    }
  }

  // Development counts
  for (const tableName of sortedTables) {
    try {
      const result = await devClient.unsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
      devCounts[tableName] = parseInt(result[0].count);
    } catch (error) {
      devCounts[tableName] = '-';
    }
  }

  // Display in clean table format
  console.log('\nTABLE NAME                | PRODUCTION | DEVELOPMENT');
  console.log('--------------------------|------------|------------');
  
  for (const tableName of sortedTables) {
    const prodCount = prodCounts[tableName];
    const devCount = devCounts[tableName];
    
    console.log(
      `${tableName.padEnd(25)} | ${String(prodCount).padStart(10)} | ${String(devCount).padStart(11)}`
    );
  }

  // Summary
  const prodTotal = Object.values(prodCounts).reduce((sum, count) => {
    return sum + (typeof count === 'number' ? count : 0);
  }, 0);
  
  const devTotal = Object.values(devCounts).reduce((sum, count) => {
    return sum + (typeof count === 'number' ? count : 0);
  }, 0);

  console.log('--------------------------|------------|------------');
  console.log(`${'TOTAL'.padEnd(25)} | ${String(prodTotal).padStart(10)} | ${String(devTotal).padStart(11)}`);
  console.log(`${'TABLES'.padEnd(25)} | ${String(Object.keys(prodCounts).length).padStart(10)} | ${String(Object.keys(devCounts).length).padStart(11)}`);

  await prodClient.end();
  await devClient.end();

} catch (error) {
  console.log(`Error: ${error.message}`);
  process.exit(1);
}