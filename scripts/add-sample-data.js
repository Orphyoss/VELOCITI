#!/usr/bin/env node

/**
 * ADD SAMPLE DATA TO DEVELOPMENT DATABASE
 * Simple data population without complex syntax
 */

import postgres from 'postgres';

console.log('📊 ADDING SAMPLE DATA TO DEVELOPMENT');
console.log('====================================');

const devUrl = process.env.DEV_SUP_DATABASE_URL;
const client = postgres(devUrl, { max: 1 });

try {
  // Simple competitive pricing data
  const routes = ['LGW-BCN', 'LTN-AMS', 'STN-DUB', 'LGW-WAW'];
  const airlines = ['EZY', 'RYR', 'W6', 'VY'];
  
  console.log('💰 Adding competitive pricing data...');
  for (const route of routes) {
    await client`
      INSERT INTO competitive_pricing (observation_date, route, airline_code, price_amount, price_currency)
      VALUES (CURRENT_DATE, ${route}, 'EZY', ${Math.floor(Math.random() * 100 + 80)}, 'GBP')
      ON CONFLICT DO NOTHING
    `;
    await client`
      INSERT INTO competitive_pricing (observation_date, route, airline_code, price_amount, price_currency)
      VALUES (CURRENT_DATE, ${route}, 'RYR', ${Math.floor(Math.random() * 100 + 60)}, 'GBP')
      ON CONFLICT DO NOTHING
    `;
  }

  console.log('✈️ Adding market capacity data...');
  for (const route of routes) {
    await client`
      INSERT INTO market_capacity (flight_date, route, airline_code, num_seats)
      VALUES (CURRENT_DATE, ${route}, 'EZY', ${Math.floor(Math.random() * 50 + 150)})
      ON CONFLICT DO NOTHING
    `;
  }

  // Verify data counts
  const [pricing, capacity, insights] = await Promise.all([
    client`SELECT COUNT(*) as count FROM competitive_pricing`,
    client`SELECT COUNT(*) as count FROM market_capacity`,
    client`SELECT COUNT(*) as count FROM intelligence_insights`
  ]);

  console.log('\n📊 DATA VERIFICATION:');
  console.log(`✅ Competitive Pricing: ${pricing[0].count} records`);
  console.log(`✅ Market Capacity: ${capacity[0].count} records`);
  console.log(`✅ Intelligence Insights: ${insights[0].count} records`);

  console.log('\n🎯 SAMPLE DATA COMPLETE!');
  await client.end();

} catch (error) {
  console.log(`❌ Error: ${error.message}`);
  await client.end();
}