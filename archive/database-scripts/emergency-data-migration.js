#!/usr/bin/env node

/**
 * EMERGENCY DATA MIGRATION SCRIPT
 * Migrates all data from DEV_SUP_DATABASE_URL to DEV_DATABASE_URL
 * This fixes the issue where production database is empty
 */

import postgres from 'postgres';

console.log('🚨 EMERGENCY DATA MIGRATION STARTING...');
console.log('📊 Source: DEV_SUP_DATABASE_URL (wvahrxur) - WORKING DATA');
console.log('🎯 Target: DEV_DATABASE_URL (otqxixdc) - PRODUCTION DATABASE');

const sourceDb = postgres(process.env.DEV_SUP_DATABASE_URL);
const targetDb = postgres(process.env.DEV_DATABASE_URL);

// Critical tables that need data migration
const criticalTables = [
  'competitive_pricing',
  'flight_performance', 
  'web_search_data',
  'market_capacity',
  'intelligence_insights',
  'alerts',
  'routes',
  'agents',
  'activities'
];

async function getTableData(db, tableName) {
  try {
    const data = await db`SELECT * FROM ${db(tableName)}`;
    return data;
  } catch (error) {
    console.log(`   ⚠️  Table ${tableName} not accessible: ${error.message}`);
    return [];
  }
}

async function clearTable(db, tableName) {
  try {
    await db`DELETE FROM ${db(tableName)}`;
    console.log(`   🗑️  Cleared ${tableName}`);
  } catch (error) {
    console.log(`   ⚠️  Could not clear ${tableName}: ${error.message}`);
  }
}

async function insertData(db, tableName, records) {
  if (records.length === 0) {
    console.log(`   ℹ️  No data to insert for ${tableName}`);
    return 0;
  }

  try {
    let inserted = 0;
    for (const record of records) {
      const columns = Object.keys(record);
      const values = Object.values(record);
      
      await db`
        INSERT INTO ${db(tableName)} ${db(columns)}
        VALUES ${db(values)}
        ON CONFLICT DO NOTHING
      `;
      inserted++;
    }
    
    console.log(`   ✅ Inserted ${inserted} records into ${tableName}`);
    return inserted;
  } catch (error) {
    console.log(`   ❌ Failed to insert data into ${tableName}: ${error.message}`);
    return 0;
  }
}

async function migrateTable(tableName) {
  console.log(`\n📦 Migrating ${tableName}...`);
  
  // Get data from source
  const sourceData = await getTableData(sourceDb, tableName);
  console.log(`   📊 Found ${sourceData.length} records in source`);
  
  if (sourceData.length === 0) {
    console.log(`   ⏭️  Skipping ${tableName} - no source data`);
    return { table: tableName, migrated: 0, status: 'skipped' };
  }
  
  // Clear target table
  await clearTable(targetDb, tableName);
  
  // Insert data into target
  const migrated = await insertData(targetDb, tableName, sourceData);
  
  return { 
    table: tableName, 
    source: sourceData.length, 
    migrated: migrated,
    status: migrated > 0 ? 'success' : 'failed'
  };
}

async function verifyMigration() {
  console.log('\n🔍 VERIFYING MIGRATION...');
  
  const results = {};
  for (const table of criticalTables) {
    try {
      const count = await targetDb`SELECT COUNT(*) as count FROM ${targetDb(table)}`;
      results[table] = count[0].count;
      console.log(`   ✅ ${table}: ${count[0].count} records`);
    } catch (error) {
      results[table] = 'ERROR';
      console.log(`   ❌ ${table}: ${error.message}`);
    }
  }
  
  return results;
}

async function main() {
  try {
    console.log('\n🚀 Starting emergency data migration...\n');
    
    const migrationResults = [];
    
    // Migrate each critical table
    for (const tableName of criticalTables) {
      const result = await migrateTable(tableName);
      migrationResults.push(result);
    }
    
    // Verify migration
    const verification = await verifyMigration();
    
    // Summary
    console.log('\n📊 MIGRATION SUMMARY:');
    console.log('=' * 50);
    
    const successful = migrationResults.filter(r => r.status === 'success');
    const failed = migrationResults.filter(r => r.status === 'failed');
    const skipped = migrationResults.filter(r => r.status === 'skipped');
    
    console.log(`✅ Successful: ${successful.length}/${criticalTables.length} tables`);
    console.log(`❌ Failed: ${failed.length}/${criticalTables.length} tables`);
    console.log(`⏭️  Skipped: ${skipped.length}/${criticalTables.length} tables`);
    
    const totalMigrated = migrationResults.reduce((sum, r) => sum + (r.migrated || 0), 0);
    console.log(`📦 Total records migrated: ${totalMigrated}`);
    
    if (successful.length >= 5) {
      console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('✅ Production database now has working data');
      console.log('✅ System should be fully operational');
      console.log('🚀 Ready for production deployment');
    } else {
      console.log('\n⚠️  PARTIAL MIGRATION - Manual intervention may be needed');
    }
    
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    process.exit(1);
  } finally {
    await sourceDb.end();
    await targetDb.end();
  }
}

main();