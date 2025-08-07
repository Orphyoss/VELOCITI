#!/usr/bin/env node

/**
 * COMPREHENSIVE PRODUCTION DEBUG
 * Deep analysis of production deployment failures
 */

import { db, client } from '../server/services/supabase.js';
import { alerts as alertsTable, agents as agentsTable } from '../shared/schema.js';

async function comprehensiveProductionDebug() {
  console.log('🔍 COMPREHENSIVE PRODUCTION DEBUG');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    // 1. Direct database verification
    console.log('\n📊 DIRECT DATABASE VERIFICATION');
    console.log('-'.repeat(40));
    
    const directCount = await client`SELECT COUNT(*) as count FROM alerts`;
    const directActiveCount = await client`SELECT COUNT(*) as count FROM alerts WHERE status = 'active'`;
    const directCriticalCount = await client`SELECT COUNT(*) as count FROM alerts WHERE priority = 'critical'`;
    
    console.log(`Direct PostgreSQL queries:`);
    console.log(`  Total alerts: ${directCount[0].count}`);
    console.log(`  Active alerts: ${directActiveCount[0].count}`);
    console.log(`  Critical alerts: ${directCriticalCount[0].count}`);
    
    // 2. Drizzle ORM verification
    console.log('\n📊 DRIZZLE ORM VERIFICATION');
    console.log('-'.repeat(40));
    
    const drizzleAlerts = await db.select().from(alertsTable);
    const drizzleAgents = await db.select().from(agentsTable);
    
    console.log(`Drizzle ORM queries:`);
    console.log(`  Total alerts: ${drizzleAlerts.length}`);
    console.log(`  Active alerts: ${drizzleAlerts.filter(a => a.status === 'active').length}`);
    console.log(`  Critical alerts: ${drizzleAlerts.filter(a => a.priority === 'critical').length}`);
    console.log(`  Total agents: ${drizzleAgents.length}`);
    
    // 3. Sample data verification
    console.log('\n📋 SAMPLE DATA VERIFICATION');
    console.log('-'.repeat(40));
    
    const sampleAlerts = drizzleAlerts.slice(0, 5);
    sampleAlerts.forEach((alert, i) => {
      console.log(`  ${i+1}. ID: ${alert.id.slice(0, 8)}... | ${alert.title?.slice(0, 40)}... | ${alert.priority} | ${alert.status}`);
    });
    
    // 4. API endpoint testing
    console.log('\n🌐 API ENDPOINT TESTING');
    console.log('-'.repeat(40));
    
    const endpoints = [
      { path: '/api/alerts', desc: 'Main alerts endpoint' },
      { path: '/api/agents', desc: 'Agents endpoint' },
      { path: '/api/metrics/alerts', desc: 'Metrics alerts endpoint' }
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\nTesting ${endpoint.desc}:`);
      
      // Local test
      try {
        const localResponse = await fetch(`http://localhost:5000${endpoint.path}`);
        const localData = await localResponse.json();
        const localCount = Array.isArray(localData) ? localData.length : 'N/A (object)';
        console.log(`  LOCAL:  ${localResponse.status} | ${localCount} items`);
      } catch (error) {
        console.log(`  LOCAL:  ERROR - ${error.message}`);
      }
      
      // Production test
      try {
        const prodResponse = await fetch(`https://velociti.replit.app${endpoint.path}`);
        const prodData = await prodResponse.json();
        const prodCount = Array.isArray(prodData) ? prodData.length : 'N/A (object)';
        console.log(`  PROD:   ${prodResponse.status} | ${prodCount} items`);
        
        // Deep inspection for alerts endpoint
        if (endpoint.path === '/api/alerts' && Array.isArray(prodData)) {
          if (prodData.length === 0) {
            console.log(`  ❌ CRITICAL: Production API returning empty array despite ${drizzleAlerts.length} alerts in database`);
          } else {
            console.log(`  ✅ Production API serving ${prodData.length} alerts`);
          }
        }
      } catch (error) {
        console.log(`  PROD:   ERROR - ${error.message}`);
      }
    }
    
    // 5. Environment analysis
    console.log('\n🔧 ENVIRONMENT ANALYSIS');
    console.log('-'.repeat(40));
    
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Present (length: ' + process.env.DATABASE_URL.length + ')' : 'Missing'}`);
    
    // 6. Database connection test
    console.log('\n🔌 DATABASE CONNECTION TEST');
    console.log('-'.repeat(40));
    
    try {
      const connectionTest = await client`SELECT NOW() as current_time, version() as postgres_version`;
      console.log(`  ✅ Database connection: OK`);
      console.log(`  Server time: ${connectionTest[0].current_time}`);
      console.log(`  PostgreSQL version: ${connectionTest[0].postgres_version.split(' ')[0]}`);
    } catch (error) {
      console.log(`  ❌ Database connection: FAILED - ${error.message}`);
    }
    
    // 7. Production deployment diagnosis
    console.log('\n🚨 PRODUCTION DEPLOYMENT DIAGNOSIS');
    console.log('-'.repeat(40));
    
    const localAlertsResponse = await fetch('http://localhost:5000/api/alerts');
    const prodAlertsResponse = await fetch('https://velociti.replit.app/api/alerts');
    
    const localAlerts = await localAlertsResponse.json();
    const prodAlerts = await prodAlertsResponse.json();
    
    console.log(`Local alerts count: ${Array.isArray(localAlerts) ? localAlerts.length : 'Not array'}`);
    console.log(`Production alerts count: ${Array.isArray(prodAlerts) ? prodAlerts.length : 'Not array'}`);
    
    if (Array.isArray(localAlerts) && Array.isArray(prodAlerts)) {
      if (localAlerts.length > 0 && prodAlerts.length === 0) {
        console.log(`❌ DEPLOYMENT ISSUE CONFIRMED: Local has ${localAlerts.length} alerts, production has 0`);
        console.log(`Root cause analysis needed: Check production database connection configuration`);
      } else if (localAlerts.length === prodAlerts.length) {
        console.log(`✅ DEPLOYMENT WORKING: Both environments have ${localAlerts.length} alerts`);
      } else {
        console.log(`⚠️ PARTIAL DEPLOYMENT ISSUE: Local has ${localAlerts.length}, production has ${prodAlerts.length}`);
      }
    }
    
    console.log('\n🎯 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Database contains: ${drizzleAlerts.length} alerts, ${drizzleAgents.length} agents`);
    console.log(`Production API status: ${Array.isArray(prodAlerts) ? `${prodAlerts.length} alerts` : 'API error'}`);
    console.log(`Debug completed at: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('❌ Comprehensive debug failed:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  comprehensiveProductionDebug().catch(console.error);
}

export default comprehensiveProductionDebug;