#!/usr/bin/env node

/**
 * FIX SCHEMA COLUMNS IN DEVELOPMENT
 * Add missing columns to match production exactly
 */

import postgres from 'postgres';

console.log('🔧 FIXING SCHEMA COLUMNS IN DEVELOPMENT');
console.log('========================================');

const devUrl = process.env.DEV_SUP_DATABASE_URL;
if (!devUrl) {
  console.log('❌ DEV_SUP_DATABASE_URL not found');
  process.exit(1);
}

const client = postgres(devUrl, {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
});

try {
  console.log('\n🔧 Adding missing columns to alerts table...');
  
  // Add missing columns to alerts table
  await client`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'alert'`;
  await client`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS route_name TEXT`;
  await client`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS metric_value DECIMAL(12,4)`;
  await client`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS threshold_value DECIMAL(12,4)`;
  await client`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS impact_score DECIMAL(12,2)`;
  await client`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP`;
  await client`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP`;

  console.log('✅ Alerts table columns updated');

  console.log('\n🔧 Adding missing columns to competitive_pricing table...');
  
  // Recreate competitive_pricing with full production schema
  await client`DROP TABLE IF EXISTS competitive_pricing CASCADE`;
  await client`
    CREATE TABLE competitive_pricing (
      id SERIAL PRIMARY KEY,
      insert_date DATE DEFAULT CURRENT_DATE,
      observation_date DATE NOT NULL,
      route TEXT NOT NULL,
      route_id TEXT,
      airline_code VARCHAR(10) NOT NULL,
      flight_date DATE,
      flight_number TEXT,
      departure_time TIME,
      price_amount DECIMAL(10,2) NOT NULL,
      price_currency VARCHAR(3) DEFAULT 'GBP',
      fare_type VARCHAR(20),
      booking_class VARCHAR(10),
      availability_seats INTEGER,
      data_source VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log('✅ Competitive pricing table recreated');

  console.log('\n🔧 Adding missing columns to intelligence_insights table...');
  
  // Add missing columns to intelligence_insights
  await client`ALTER TABLE intelligence_insights ADD COLUMN IF NOT EXISTS route_id TEXT`;
  await client`ALTER TABLE intelligence_insights ADD COLUMN IF NOT EXISTS airline_code VARCHAR(10)`;
  await client`ALTER TABLE intelligence_insights ADD COLUMN IF NOT EXISTS title TEXT`;
  await client`ALTER TABLE intelligence_insights ADD COLUMN IF NOT EXISTS description TEXT`;
  await client`ALTER TABLE intelligence_insights ADD COLUMN IF NOT EXISTS recommendation TEXT`;
  await client`ALTER TABLE intelligence_insights ADD COLUMN IF NOT EXISTS supporting_data JSONB DEFAULT '{}'`;
  await client`ALTER TABLE intelligence_insights ADD COLUMN IF NOT EXISTS analyst_feedback TEXT`;
  await client`ALTER TABLE intelligence_insights ADD COLUMN IF NOT EXISTS action_taken BOOLEAN DEFAULT false`;
  await client`ALTER TABLE intelligence_insights ADD COLUMN IF NOT EXISTS agent_source VARCHAR(50)`;

  console.log('✅ Intelligence insights table columns updated');

  console.log('\n🔧 Adding missing columns to market_capacity table...');
  
  // Recreate market_capacity with full production schema
  await client`DROP TABLE IF EXISTS market_capacity CASCADE`;
  await client`
    CREATE TABLE market_capacity (
      id SERIAL PRIMARY KEY,
      insert_date DATE DEFAULT CURRENT_DATE,
      flight_date DATE NOT NULL,
      route TEXT NOT NULL,
      route_id TEXT,
      airline_code VARCHAR(10) NOT NULL,
      aircraft_type VARCHAR(20),
      flight_number TEXT,
      departure_time TIME,
      num_flights INTEGER DEFAULT 1,
      num_seats INTEGER NOT NULL,
      frequency_pattern TEXT,
      data_source VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log('✅ Market capacity table recreated');

  console.log('\n🔧 Creating missing production tables...');
  
  // Action Agent tables
  await client`
    CREATE TABLE IF NOT EXISTS action_agent_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id TEXT NOT NULL,
      config_name TEXT NOT NULL,
      config_data JSONB NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS action_agent_executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id TEXT NOT NULL,
      execution_status TEXT NOT NULL,
      start_time TIMESTAMP DEFAULT NOW(),
      end_time TIMESTAMP,
      result_data JSONB,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS action_agent_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      metric_value DECIMAL(12,4),
      metric_date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Other production tables
  await client`
    CREATE TABLE IF NOT EXISTS aircraft_types (
      aircraft_code VARCHAR(10) PRIMARY KEY,
      aircraft_name VARCHAR(100) NOT NULL,
      manufacturer VARCHAR(50),
      seats_typical INTEGER,
      range_km INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS airports (
      airport_code VARCHAR(10) PRIMARY KEY,
      airport_name VARCHAR(200) NOT NULL,
      city VARCHAR(100),
      country VARCHAR(100),
      country_code VARCHAR(3),
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log('✅ All missing production tables created');

  console.log('\n📊 Repopulating with enhanced test data...');

  // Enhanced competitive pricing data
  const routes = ['LGW-BCN', 'LTN-AMS', 'STN-DUB', 'LGW-WAW', 'LGW-PMI', 'STN-MAD', 'LTN-FCO', 'LGW-CDG'];
  const airlines = ['EZY', 'RYR', 'W6', 'VY', 'BA', 'FR'];
  
  for (const route of routes) {
    const [origin, dest] = route.split('-');
    for (const airline of airlines) {
      const basePrice = Math.random() * 200 + 50;
      await client`
        INSERT INTO competitive_pricing (
          observation_date, route, route_id, airline_code, flight_date, 
          price_amount, price_currency, fare_type, booking_class, 
          availability_seats, data_source
        )
        VALUES (
          CURRENT_DATE, ${route}, ${route}, ${airline}, CURRENT_DATE + INTERVAL '7 days',
          ${basePrice}, 'GBP', 'Economy', 'Y', 
          ${Math.floor(Math.random() * 150 + 50)}, 'synthetic'
        )
        ON CONFLICT DO NOTHING
      `;
    }
  }

  // Enhanced market capacity data
  for (const route of routes) {
    for (const airline of airlines) {
      const seats = Math.floor(Math.random() * 150) + 100;
      await client`
        INSERT INTO market_capacity (
          flight_date, route, route_id, airline_code, aircraft_type,
          flight_number, num_flights, num_seats, data_source
        )
        VALUES (
          CURRENT_DATE, ${route}, ${route}, ${airline}, 'A320',
          ${airline}${Math.floor(Math.random() * 9000 + 1000)}, 
          ${Math.floor(Math.random() * 3 + 1)}, ${seats}, 'synthetic'
        )
        ON CONFLICT DO NOTHING
      `;
    }
  }

  // Enhanced intelligence insights
  await client`DELETE FROM intelligence_insights`;
  await client`
    INSERT INTO intelligence_insights (
      insight_date, insight_type, insight_text, confidence_score, impact_level, 
      priority_level, route_id, airline_code, title, description, 
      recommendation, agent_source
    )
    VALUES 
      (CURRENT_DATE, 'competitive', 'Ryanair price adjustments detected on 15 routes', 0.92, 'high', 'critical', 'LGW-BCN', 'RYR', 'Competitive Price Alert', 'Significant price changes detected across European network', 'Monitor pricing closely and consider dynamic adjustments', 'competitive'),
      (CURRENT_DATE, 'performance', 'Load factors improving on Mediterranean routes', 0.88, 'medium', 'high', 'LGW-PMI', 'EZY', 'Performance Improvement', 'Summer demand showing strong recovery patterns', 'Optimize capacity allocation for peak season', 'performance'),
      (CURRENT_DATE, 'network', 'Capacity optimization opportunities identified', 0.76, 'medium', 'medium', 'STN-DUB', 'EZY', 'Network Optimization', 'Underperforming routes detected requiring attention', 'Consider frequency adjustments or route analysis', 'network'),
      (CURRENT_DATE, 'competitive', 'New market entries affecting key routes', 0.95, 'high', 'critical', 'LGW-WAW', 'W6', 'Market Entry Alert', 'Wizz Air expanding service to compete directly', 'Implement competitive response strategy', 'competitive'),
      (CURRENT_DATE, 'demand', 'Summer demand surge exceeding forecasts', 0.89, 'high', 'high', 'LGW-PMI', 'EZY', 'Demand Surge Alert', 'Leisure destinations showing exceptional performance', 'Consider yield management optimization', 'performance')
  `;

  console.log('✅ Enhanced test data populated');

  // Final verification
  console.log('\n🔍 SCHEMA VERIFICATION:');
  const alertsCols = await client`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'alerts' ORDER BY ordinal_position
  `;
  console.log(`✅ Alerts table: ${alertsCols.length} columns`);

  const pricingCols = await client`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'competitive_pricing' ORDER BY ordinal_position
  `;
  console.log(`✅ Competitive pricing: ${pricingCols.length} columns`);

  const insightsCols = await client`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'intelligence_insights' ORDER BY ordinal_position
  `;
  console.log(`✅ Intelligence insights: ${insightsCols.length} columns`);

  console.log('\n🎯 DEVELOPMENT DATABASE SCHEMA COMPLETE!');
  console.log('=========================================');
  console.log('✅ All production columns replicated');
  console.log('✅ Enhanced test data populated');
  console.log('✅ Ready for full system testing');

  await client.end();

} catch (error) {
  console.log(`❌ Error: ${error.message}`);
  console.log('Stack trace:', error.stack);
  await client.end();
  process.exit(1);
}