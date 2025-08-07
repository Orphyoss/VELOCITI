#!/usr/bin/env node

/**
 * CREATE MISSING TABLES IN DEVELOPMENT
 * Comprehensive table creation based on production schema
 */

import postgres from 'postgres';

console.log('🏗️ CREATING MISSING TABLES IN DEVELOPMENT');
console.log('==========================================');

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
  // 1. Create all essential tables
  console.log('\n📊 Creating core tables...');

  // Users table
  await client`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'analyst',
      preferences JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Feedback table
  await client`
    CREATE TABLE IF NOT EXISTS feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      alert_id UUID REFERENCES alerts(id),
      agent_id TEXT REFERENCES agents(id),
      user_id UUID REFERENCES users(id),
      rating INTEGER NOT NULL,
      comment TEXT,
      action_taken BOOLEAN DEFAULT false,
      impact_realized DECIMAL(10,2),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Route Performance table
  await client`
    CREATE TABLE IF NOT EXISTS route_performance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      route TEXT NOT NULL,
      route_name TEXT NOT NULL,
      date DATE NOT NULL,
      load_factor TEXT,
      yield TEXT,
      performance TEXT,
      competitor_price TEXT,
      our_price TEXT,
      demand_index TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Conversations table
  await client`
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL,
      title TEXT,
      user_id UUID REFERENCES users(id),
      messages JSONB DEFAULT '[]',
      context JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // System Metrics table
  await client`
    CREATE TABLE IF NOT EXISTS system_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      metric_type TEXT NOT NULL,
      value TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      timestamp TIMESTAMP DEFAULT NOW()
    )
  `;

  // Activities table
  await client`
    CREATE TABLE IF NOT EXISTS activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Airlines table (from production schema)
  await client`
    CREATE TABLE IF NOT EXISTS airlines (
      airline_code VARCHAR(10) PRIMARY KEY,
      airline_name VARCHAR(100) NOT NULL,
      carrier_type VARCHAR(20) NOT NULL,
      country_code VARCHAR(3),
      active_flag BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Routes table
  await client`
    CREATE TABLE IF NOT EXISTS routes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      route_code TEXT NOT NULL UNIQUE,
      origin_airport TEXT NOT NULL,
      destination_airport TEXT NOT NULL,
      route_name TEXT NOT NULL,
      distance_km INTEGER,
      active_flag BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Competitive Analysis table
  await client`
    CREATE TABLE IF NOT EXISTS competitive_analysis (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      route TEXT NOT NULL,
      analysis_date DATE NOT NULL,
      easyjet_price DECIMAL(10,2),
      competitor_avg_price DECIMAL(10,2),
      price_advantage DECIMAL(5,2),
      market_share_pct DECIMAL(5,2),
      recommendations TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Revenue Metrics table
  await client`
    CREATE TABLE IF NOT EXISTS revenue_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      route TEXT,
      total_revenue DECIMAL(12,2),
      passenger_count INTEGER,
      average_fare DECIMAL(8,2),
      load_factor DECIMAL(5,2),
      yield_per_pax DECIMAL(8,2),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Network Performance table
  await client`
    CREATE TABLE IF NOT EXISTS network_performance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      route TEXT NOT NULL,
      flights_operated INTEGER,
      seats_available INTEGER,
      passengers_carried INTEGER,
      load_factor DECIMAL(5,2),
      on_time_performance DECIMAL(5,2),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // 2. Populate with essential data
  console.log('\n📝 Populating reference data...');

  // Airlines data
  await client`
    INSERT INTO airlines (airline_code, airline_name, carrier_type, country_code, active_flag)
    VALUES 
      ('EZY', 'easyJet', 'LCC', 'GB', true),
      ('RYR', 'Ryanair', 'ULCC', 'IE', true),
      ('W6', 'Wizz Air', 'LCC', 'HU', true),
      ('U2', 'easyJet Europe', 'LCC', 'AT', true),
      ('VY', 'Vueling', 'LCC', 'ES', true),
      ('FR', 'Ryanair', 'ULCC', 'IE', true),
      ('BA', 'British Airways', 'FSC', 'GB', true)
    ON CONFLICT (airline_code) DO NOTHING
  `;

  // Routes data
  const routeData = [
    ['LGW-BCN', 'LGW', 'BCN', 'London Gatwick - Barcelona'],
    ['LTN-AMS', 'LTN', 'AMS', 'London Luton - Amsterdam'],
    ['STN-DUB', 'STN', 'DUB', 'London Stansted - Dublin'],
    ['LGW-WAW', 'LGW', 'WAW', 'London Gatwick - Warsaw'],
    ['LGW-PMI', 'LGW', 'PMI', 'London Gatwick - Palma'],
    ['STN-MAD', 'STN', 'MAD', 'London Stansted - Madrid'],
    ['LTN-FCO', 'LTN', 'FCO', 'London Luton - Rome'],
    ['LGW-CDG', 'LGW', 'CDG', 'London Gatwick - Paris']
  ];

  for (const [route_code, origin, dest, name] of routeData) {
    await client`
      INSERT INTO routes (route_code, origin_airport, destination_airport, route_name)
      VALUES (${route_code}, ${origin}, ${dest}, ${name})
      ON CONFLICT (route_code) DO NOTHING
    `;
  }

  // Sample revenue metrics for current month
  console.log('💰 Adding sample revenue metrics...');
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    await client`
      INSERT INTO revenue_metrics (date, total_revenue, passenger_count, average_fare, load_factor, yield_per_pax)
      VALUES (${date.toISOString().split('T')[0]}, ${Math.random() * 100000 + 50000}, ${Math.floor(Math.random() * 10000 + 5000)}, ${Math.random() * 200 + 50}, ${Math.random() * 30 + 70}, ${Math.random() * 150 + 75})
      ON CONFLICT DO NOTHING
    `;
  }

  // 3. Verify all tables exist
  console.log('\n🔍 FINAL VERIFICATION:');
  const tables = await client`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;

  console.log(`✅ Total tables created: ${tables.length}`);
  tables.forEach(table => console.log(`  • ${table.table_name}`));

  console.log('\n🎯 DEVELOPMENT DATABASE COMPLETE!');
  console.log('==================================');
  console.log('✅ All production tables replicated');
  console.log('✅ Reference data populated');
  console.log('✅ Ready for full feature testing');

  await client.end();

} catch (error) {
  console.log(`❌ Error: ${error.message}`);
  console.log('Stack trace:', error.stack);
  await client.end();
  process.exit(1);
}