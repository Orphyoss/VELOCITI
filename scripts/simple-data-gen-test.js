#!/usr/bin/env node

/**
 * SIMPLE DATA GENERATION TEST
 * Generate actual database records with proper error handling
 */

import { db } from '../server/services/supabase.js';

console.log('🚀 Simple Data Generation Test');
console.log('==============================');

async function generateTestData() {
  const testDate = '2025-08-05';
  let totalRecords = 0;
  
  try {
    console.log(`Generating test data for ${testDate}...`);
    
    // Generate competitive pricing records
    console.log('\n📊 Generating competitive pricing...');
    const routes = ['LGW-BCN', 'LGW-MAD'];
    const airlines = ['EZY', 'RYR'];
    let pricingRecords = 0;
    
    for (const route of routes) {
      for (const airline of airlines) {
        try {
          const price = Math.round((100 + Math.random() * 100) * 100) / 100;
          const departureDate = new Date();
          departureDate.setDate(departureDate.getDate() + 7);
          
          await db.execute(`
            INSERT INTO competitive_pricing (
              insert_date, observation_date, route_id, airline_code, 
              flight_date, price_amount, price_currency, booking_class
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8
            )
          `, [
            new Date().toISOString(),
            testDate,
            route,
            airline,
            departureDate.toISOString().split('T')[0],
            price,
            'GBP',
            'Y'
          ]);
          
          pricingRecords++;
          console.log(`  ✓ ${route}-${airline}: £${price}`);
        } catch (error) {
          console.log(`  ❌ ${route}-${airline}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n✅ Generated ${pricingRecords} competitive pricing records`);
    totalRecords += pricingRecords;
    
    // Generate web search data
    console.log('\n🔍 Generating web search data...');
    let searchRecords = 0;
    
    for (const route of routes) {
      try {
        const searchVolume = Math.floor(1000 + Math.random() * 2000);
        const bookingVolume = Math.floor(searchVolume * (0.03 + Math.random() * 0.05));
        const conversionRate = bookingVolume / searchVolume;
        const avgPrice = Math.round((80 + Math.random() * 120) * 100) / 100;
        
        await db.execute(`
          INSERT INTO web_search_data (
            insert_date, search_date, route_id, search_volume, 
            booking_volume, conversion_rate, avg_search_price, price_currency
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          )
        `, [
          new Date().toISOString(),
          testDate,
          route,
          searchVolume,
          bookingVolume,
          conversionRate,
          avgPrice,
          'GBP'
        ]);
        
        searchRecords++;
        console.log(`  ✓ ${route}: ${searchVolume} searches, ${bookingVolume} bookings (${Math.round(conversionRate * 100 * 10) / 10}%)`);
      } catch (error) {
        console.log(`  ❌ ${route}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Generated ${searchRecords} web search records`);
    totalRecords += searchRecords;
    
    // Generate intelligence insights
    console.log('\n🧠 Generating intelligence insights...');
    let insightRecords = 0;
    
    const insightTypes = ['competitive_move', 'market_opportunity'];
    
    for (const insightType of insightTypes) {
      try {
        await db.execute(`
          INSERT INTO intelligence_insights (
            insight_date, insight_type, title, description,
            confidence_score, impact_level, affected_routes, created_date
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          )
        `, [
          testDate,
          insightType,
          `${insightType.replace('_', ' ')} detected`,
          `Test generation of ${insightType} for ${testDate}`,
          Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
          Math.floor(Math.random() * 5) + 1,
          JSON.stringify(['LGW-BCN', 'LGW-MAD']),
          new Date().toISOString()
        ]);
        
        insightRecords++;
        console.log(`  ✓ ${insightType}: created`);
      } catch (error) {
        console.log(`  ❌ ${insightType}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Generated ${insightRecords} intelligence insights`);
    totalRecords += insightRecords;
    
    console.log(`\n🎉 TOTAL RECORDS GENERATED: ${totalRecords}`);
    
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
  }
}

generateTestData();