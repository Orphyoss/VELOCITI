#!/usr/bin/env node

/**
 * Debug Production API Script
 * Tests production API endpoints and database connectivity
 */

import { db, client } from '../server/services/supabase.js';
import { alerts, agents } from '../shared/schema.js';

async function debugProductionAPI() {
  console.log('🔍 DEBUGGING PRODUCTION API');
  console.log('='.repeat(40));
  
  try {
    // Test direct database connection
    console.log('📊 Testing direct database connection...');
    const directQuery = await client`SELECT COUNT(*) as count FROM alerts`;
    console.log(`Direct PostgreSQL query result: ${directQuery[0].count} alerts`);
    
    // Test Drizzle ORM connection
    console.log('📊 Testing Drizzle ORM connection...');
    const drizzleAlerts = await db.select().from(alerts);
    console.log(`Drizzle ORM query result: ${drizzleAlerts.length} alerts`);
    
    // Test individual APIs
    const productionUrl = 'https://velociti.replit.app';
    const localUrl = 'http://localhost:5000';
    
    const endpoints = [
      '/api/alerts',
      '/api/agents', 
      '/api/metrics/alerts'
    ];
    
    console.log('\n🌐 Testing API endpoints...');
    
    for (const endpoint of endpoints) {
      console.log(`\n--- Testing ${endpoint} ---`);
      
      // Test local
      try {
        const localResponse = await fetch(`${localUrl}${endpoint}`);
        const localData = await localResponse.json();
        console.log(`LOCAL ${endpoint}: ${localResponse.status} - ${Array.isArray(localData) ? localData.length + ' items' : 'object'}`);
      } catch (error) {
        console.log(`LOCAL ${endpoint}: ERROR - ${error.message}`);
      }
      
      // Test production
      try {
        const prodResponse = await fetch(`${productionUrl}${endpoint}`);
        const prodData = await prodResponse.json();
        console.log(`PROD ${endpoint}: ${prodResponse.status} - ${Array.isArray(prodData) ? prodData.length + ' items' : 'object'}`);
        
        if (endpoint === '/api/alerts' && Array.isArray(prodData) && prodData.length === 0) {
          console.log('❌ PRODUCTION API RETURNING EMPTY ARRAY - DATABASE CONNECTION ISSUE');
        }
      } catch (error) {
        console.log(`PROD ${endpoint}: ERROR - ${error.message}`);
      }
    }
    
    // Check environment variables
    console.log('\n🔧 Environment Check...');
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Present' : 'Missing'}`);
    
    console.log('\n✅ Debug complete - Check results above');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugProductionAPI().catch(console.error);
}

export default debugProductionAPI;