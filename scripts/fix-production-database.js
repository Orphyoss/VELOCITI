#!/usr/bin/env node

/**
 * PRODUCTION DATABASE CONNECTION FIX
 * Diagnoses and fixes production database connectivity issues
 */

import { db, client } from '../server/services/supabase.js';
import { alerts as alertsTable, agents as agentsTable } from '../shared/schema.js';

async function fixProductionDatabase() {
  console.log('🔧 PRODUCTION DATABASE CONNECTION FIX');
  console.log('='.repeat(60));
  
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Present' : 'Missing'}`);
  
  try {
    // 1. Test direct PostgreSQL connection
    console.log('\n📡 TESTING DIRECT POSTGRESQL CONNECTION');
    console.log('-'.repeat(40));
    
    const connectionTest = await client`SELECT COUNT(*) as count FROM alerts`;
    console.log(`✅ Direct PostgreSQL: ${connectionTest[0].count} alerts found`);
    
    // 2. Test Drizzle ORM connection  
    console.log('\n🔗 TESTING DRIZZLE ORM CONNECTION');
    console.log('-'.repeat(40));
    
    const drizzleTest = await db.select().from(alertsTable);
    console.log(`✅ Drizzle ORM: ${drizzleTest.length} alerts found`);
    
    // 3. Test production environment database queries
    console.log('\n🏭 TESTING PRODUCTION QUERIES');
    console.log('-'.repeat(40));
    
    // Simulate the exact query from the API endpoint
    const apiQuery = await db.select()
      .from(alertsTable)  
      .orderBy(alertsTable.created_at)
      .limit(50);
      
    console.log(`✅ API Query Simulation: ${apiQuery.length} alerts returned`);
    
    if (apiQuery.length === 0) {
      console.log('❌ CRITICAL: API query returning empty results');
      
      // Try different query approaches
      const allAlerts = await db.select().from(alertsTable);
      console.log(`  - Raw select all: ${allAlerts.length} alerts`);
      
      const countQuery = await db.select().from(alertsTable);
      console.log(`  - Count verification: ${countQuery.length} alerts`);
      
      // Check for potential ordering issues
      const noOrderQuery = await db.select().from(alertsTable).limit(50);
      console.log(`  - No order query: ${noOrderQuery.length} alerts`);
      
    } else {
      console.log('✅ Production queries working correctly');
      
      // Display sample data
      console.log('\n📋 SAMPLE DATA VERIFICATION');
      console.log('-'.repeat(40));
      
      const sampleAlert = apiQuery[0];
      console.log(`Sample alert: ${sampleAlert.id.slice(0, 8)}... | ${sampleAlert.title?.slice(0, 40)}...`);
      console.log(`Status: ${sampleAlert.status} | Priority: ${sampleAlert.priority}`);
    }
    
    // 4. Test agents endpoint  
    console.log('\n👥 TESTING AGENTS ENDPOINT');
    console.log('-'.repeat(40));
    
    const agentsTest = await db.select().from(agentsTable);
    console.log(`✅ Agents: ${agentsTest.length} agents found`);
    
    // 5. Environment variable verification
    console.log('\n🔍 ENVIRONMENT VERIFICATION');
    console.log('-'.repeat(40));
    
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
    console.log(`DATABASE_URL length: ${process.env.DATABASE_URL?.length || 0}`);
    console.log(`Database URL starts with: ${process.env.DATABASE_URL?.slice(0, 20)}...`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Production database fix failed:', error);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Execute
fixProductionDatabase().then(success => {
  console.log(`\n${success ? '✅ Production database connection verified' : '❌ Production database connection failed'}`);
  process.exit(success ? 0 : 1);
}).catch(console.error);