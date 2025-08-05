#!/usr/bin/env node

/**
 * DIRECT DATABASE INSERT TEST
 * Test direct database insertion to verify schema and fix data generation
 */

import { db } from '../server/services/supabase.js';

console.log('🔧 Testing Direct Database Insertions');
console.log('=====================================');

async function testInserts() {
  try {
    console.log('Testing competitive_pricing insertion...');
    
    // Test competitive_pricing insert
    try {
      const result = await db.execute(`
        INSERT INTO competitive_pricing (
          insert_date, observation_date, route_id, airline_code, 
          flight_date, price_amount, price_currency, booking_class
        ) VALUES (
          NOW(), CURRENT_DATE, 'TEST-ROUTE', 'TEST', CURRENT_DATE + INTERVAL '7 days', 150.50, 'GBP', 'Y'
        ) RETURNING id
      `);
      console.log('✅ competitive_pricing insert SUCCESS - ID:', result[0]?.id);
    } catch (error) {
      console.log('❌ competitive_pricing insert FAILED:', error.message);
    }

    // Test market_capacity insert
    console.log('\nTesting market_capacity insertion...');
    try {
      const result = await db.execute(`
        INSERT INTO market_capacity (
          route_id, analysis_date, total_seats, easyjet_seats, 
          market_share_pct, competitive_index, created_date
        ) VALUES (
          'TEST-ROUTE', CURRENT_DATE, 300, 100, 33.33, 0.75, NOW()
        ) RETURNING route_id
      `);
      console.log('✅ market_capacity insert SUCCESS - Route:', result[0]?.route_id);
    } catch (error) {
      console.log('❌ market_capacity insert FAILED:', error.message);
    }

    // Test web_search_data insert
    console.log('\nTesting web_search_data insertion...');
    try {
      const result = await db.execute(`
        INSERT INTO web_search_data (
          insert_date, search_date, route_id, search_volume, 
          booking_volume, conversion_rate, avg_search_price, price_currency
        ) VALUES (
          NOW(), CURRENT_DATE, 'TEST-ROUTE', 1500, 75, 0.05, 125.00, 'GBP'
        ) RETURNING id
      `);
      console.log('✅ web_search_data insert SUCCESS - ID:', result[0]?.id);
    } catch (error) {
      console.log('❌ web_search_data insert FAILED:', error.message);
    }

    // Test flight_performance insert
    console.log('\nTesting flight_performance insertion...');
    try {
      const result = await db.execute(`
        INSERT INTO flight_performance (
          route_id, flight_date, flights_operated, on_time_performance,
          avg_load_factor, cancellation_rate, delay_minutes, created_date
        ) VALUES (
          'TEST-ROUTE', CURRENT_DATE, 4, 85.5, 78.2, 2.1, 12, NOW()
        ) RETURNING route_id
      `);
      console.log('✅ flight_performance insert SUCCESS - Route:', result[0]?.route_id);
    } catch (error) {
      console.log('❌ flight_performance insert FAILED:', error.message);
    }

    // Test intelligence_insights insert
    console.log('\nTesting intelligence_insights insertion...');
    try {
      const result = await db.execute(`
        INSERT INTO intelligence_insights (
          insight_date, insight_type, title, description,
          confidence_score, impact_level, affected_routes, created_date
        ) VALUES (
          CURRENT_DATE, 'test_insight', 'Test Insight', 'Test Description',
          0.85, 3, '["TEST-ROUTE"]', NOW()
        ) RETURNING id
      `);
      console.log('✅ intelligence_insights insert SUCCESS - ID:', result[0]?.id);
    } catch (error) {
      console.log('❌ intelligence_insights insert FAILED:', error.message);
    }

    console.log('\n🧹 Cleaning up test records...');
    
    // Clean up test records
    await db.execute(`DELETE FROM competitive_pricing WHERE airline_code = 'TEST'`);
    await db.execute(`DELETE FROM market_capacity WHERE route_id = 'TEST-ROUTE'`);
    await db.execute(`DELETE FROM web_search_data WHERE route_id = 'TEST-ROUTE'`);
    await db.execute(`DELETE FROM flight_performance WHERE route_id = 'TEST-ROUTE'`);
    await db.execute(`DELETE FROM intelligence_insights WHERE insight_type = 'test_insight'`);
    
    console.log('✅ Test cleanup completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInserts();