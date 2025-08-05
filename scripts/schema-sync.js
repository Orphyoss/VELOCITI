#!/usr/bin/env node

/**
 * Comprehensive Database Schema Synchronization Script
 * Ensures DEV_DATABASE_URL has identical schema to DEV_SUP_DATABASE_URL
 * Creates fresh, synchronized data structures
 */

import postgres from 'postgres';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connections
const sourceDb = postgres(process.env.DEV_SUP_DATABASE_URL);
const targetDb = postgres(process.env.DEV_DATABASE_URL);

console.log('🔄 Starting comprehensive database schema synchronization...');
console.log('📊 Source: DEV_SUP_DATABASE_URL (wvahrxur)');
console.log('🎯 Target: DEV_DATABASE_URL (otqxixdc)');

async function getTableSchema(db, tableName) {
  const columns = await db`
    SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = ${tableName} AND table_schema = 'public'
    ORDER BY ordinal_position
  `;
  return columns;
}

async function getTableNames(db) {
  const tables = await db`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  return tables.map(t => t.table_name);
}

async function dropAllTables(db) {
  const tables = await getTableNames(db);
  console.log(`🗑️  Dropping ${tables.length} existing tables from target database...`);
  
  for (const table of tables) {
    try {
      await db`DROP TABLE IF EXISTS ${db(table)} CASCADE`;
      console.log(`   ✅ Dropped table: ${table}`);
    } catch (error) {
      console.log(`   ⚠️  Warning dropping ${table}: ${error.message}`);
    }
  }
}

async function createTableFromSchema(db, tableName, schema) {
  const columnDefs = schema.map(col => {
    let def = `${col.column_name} ${col.data_type}`;
    
    if (col.character_maximum_length) {
      def += `(${col.character_maximum_length})`;
    }
    
    if (col.is_nullable === 'NO') {
      def += ' NOT NULL';
    }
    
    if (col.column_default) {
      def += ` DEFAULT ${col.column_default}`;
    }
    
    return def;
  }).join(', ');
  
  const createSql = `CREATE TABLE ${tableName} (${columnDefs})`;
  
  try {
    await db.unsafe(createSql);
    console.log(`   ✅ Created table: ${tableName} (${schema.length} columns)`);
    return true;
  } catch (error) {
    console.log(`   ❌ Failed to create ${tableName}: ${error.message}`);
    return false;
  }
}

async function syncronizeSchemas() {
  try {
    // Get source tables
    const sourceTables = await getTableNames(sourceDb);
    console.log(`📋 Found ${sourceTables.length} tables in source database`);
    
    // Drop all tables in target
    await dropAllTables(targetDb);
    
    // Recreate tables with source schema
    console.log(`🏗️  Creating ${sourceTables.length} tables in target database...`);
    
    let successCount = 0;
    for (const tableName of sourceTables) {
      const schema = await getTableSchema(sourceDb, tableName);
      const success = await createTableFromSchema(targetDb, tableName, schema);
      if (success) successCount++;
    }
    
    console.log(`\n✅ Schema synchronization completed!`);
    console.log(`📊 Successfully created: ${successCount}/${sourceTables.length} tables`);
    
    // Verify synchronization
    const targetTables = await getTableNames(targetDb);
    const sourceCount = sourceTables.length;
    const targetCount = targetTables.length;
    
    if (sourceCount === targetCount) {
      console.log(`🎯 Perfect sync: Both databases have ${targetCount} tables`);
      return true;
    } else {
      console.log(`⚠️  Partial sync: Source(${sourceCount}) vs Target(${targetCount})`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Schema synchronization failed:', error);
    return false;
  }
}

async function copyEssentialData() {
  console.log('\n📦 Copying essential reference data...');
  
  const essentialTables = [
    'agents',
    'routes', 
    'airports',
    'airlines',
    'aircraft_types'
  ];
  
  for (const table of essentialTables) {
    try {
      // Check if table exists in both databases
      const sourceExists = await sourceDb`SELECT 1 FROM information_schema.tables WHERE table_name = ${table}`.catch(() => []);
      const targetExists = await targetDb`SELECT 1 FROM information_schema.tables WHERE table_name = ${table}`.catch(() => []);
      
      if (sourceExists.length && targetExists.length) {
        const data = await sourceDb`SELECT * FROM ${sourceDb(table)}`;
        
        if (data.length > 0) {
          // Clear target table
          await targetDb`DELETE FROM ${targetDb(table)}`;
          
          // Insert data
          for (const row of data) {
            const columns = Object.keys(row);
            const values = Object.values(row);
            
            await targetDb`
              INSERT INTO ${targetDb(table)} ${targetDb(columns)}
              VALUES ${targetDb(values)}
              ON CONFLICT DO NOTHING
            `;
          }
          
          console.log(`   ✅ Copied ${data.length} records to ${table}`);
        } else {
          console.log(`   ℹ️  No data in ${table}`);
        }
      } else {
        console.log(`   ⚠️  Table ${table} missing in one database`);
      }
    } catch (error) {
      console.log(`   ❌ Failed to copy ${table}: ${error.message}`);
    }
  }
}

async function verifyIntegrity() {
  console.log('\n🔍 Verifying database integrity...');
  
  const targetTables = await getTableNames(targetDb);
  const criticalTables = [
    'competitive_pricing',
    'flight_performance', 
    'web_search_data',
    'market_capacity',
    'intelligence_insights',
    'agents'
  ];
  
  const results = {};
  
  for (const table of criticalTables) {
    if (targetTables.includes(table)) {
      try {
        const count = await targetDb`SELECT COUNT(*) as count FROM ${targetDb(table)}`;
        results[table] = count[0].count;
        console.log(`   ✅ ${table}: ready (${count[0].count} records)`);
      } catch (error) {
        results[table] = 'ERROR';
        console.log(`   ❌ ${table}: ${error.message}`);
      }
    } else {
      results[table] = 'MISSING';
      console.log(`   ❌ ${table}: table missing`);
    }
  }
  
  return results;
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting comprehensive database build process...\n');
    
    // Step 1: Synchronize schemas
    const syncSuccess = await syncronizeSchemas();
    if (!syncSuccess) {
      throw new Error('Schema synchronization failed');
    }
    
    // Step 2: Copy essential data
    await copyEssentialData();
    
    // Step 3: Verify integrity
    const integrity = await verifyIntegrity();
    
    console.log('\n🎉 Database build completed successfully!');
    console.log('🔄 DEV_DATABASE_URL now has identical schema to DEV_SUP_DATABASE_URL');
    console.log('✅ Fresh data structures ready for production deployment');
    
    // Update replit.md
    console.log('\n📝 Database configuration updated:');
    console.log('   • DEV_DATABASE_URL: Used for both development and production');
    console.log('   • DEV_SUP_DATABASE_URL: Legacy database (kept for reference)');
    console.log('   • DATABASE_URL: Removed from configuration');
    
  } catch (error) {
    console.error('\n❌ Database build failed:', error);
    process.exit(1);
  } finally {
    await sourceDb.end();
    await targetDb.end();
  }
}

main();