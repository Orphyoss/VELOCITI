#!/usr/bin/env node

/**
 * POPULATE DEVELOPMENT DATABASE WITH SYNTHETIC DATA
 * Create comprehensive test datasets for development
 */

import postgres from 'postgres';

console.log('🚀 POPULATING DEVELOPMENT WITH SYNTHETIC DATA');
console.log('==============================================');

const devSupUrl = process.env.DEV_SUP_DATABASE_URL;
if (!devSupUrl) {
  console.log('❌ DEV_SUP_DATABASE_URL not found');
  process.exit(1);
}

console.log(`Connecting to development: ${devSupUrl.substring(0, 50)}...`);

const client = postgres(devSupUrl, {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
});

try {
  // 1. Create missing tables
  console.log('\n📊 Creating missing tables...');
  
  await client`
    CREATE TABLE IF NOT EXISTS competitive_pricing (
      id SERIAL PRIMARY KEY,
      route VARCHAR(10) NOT NULL,
      airline_code VARCHAR(10) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS market_capacity (
      id SERIAL PRIMARY KEY,
      route VARCHAR(10) NOT NULL,
      airline_code VARCHAR(10) NOT NULL,
      seats INTEGER NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // 2. Add competitive pricing data
  console.log('💰 Adding competitive pricing data...');
  const routes = ['LGW-BCN', 'LTN-AMS', 'STN-DUB', 'LGW-WAW', 'LGW-PMI', 'STN-MAD', 'LTN-FCO'];
  const airlines = ['EZY', 'RYR', 'W6', 'VY'];
  
  for (const route of routes) {
    for (const airline of airlines) {
      const basePrice = Math.random() * 200 + 50; // £50-250
      await client`
        INSERT INTO competitive_pricing (route, airline_code, price, date)
        VALUES (${route}, ${airline}, ${basePrice}, CURRENT_DATE)
        ON CONFLICT DO NOTHING
      `;
    }
  }

  // 3. Add market capacity data
  console.log('✈️ Adding market capacity data...');
  for (const route of routes) {
    for (const airline of airlines) {
      const seats = Math.floor(Math.random() * 150) + 100; // 100-250 seats
      await client`
        INSERT INTO market_capacity (route, airline_code, seats, date)
        VALUES (${route}, ${airline}, ${seats}, CURRENT_DATE)
        ON CONFLICT DO NOTHING
      `;
    }
  }

  // 4. Fix intelligence_insights table structure
  console.log('💡 Updating intelligence insights...');
  await client`
    ALTER TABLE intelligence_insights 
    ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'medium'
  `;

  // Clear and repopulate insights
  await client`DELETE FROM intelligence_insights`;
  await client`
    INSERT INTO intelligence_insights (insight_date, insight_type, insight_text, confidence_score, impact_level, priority_level)
    VALUES 
      ('2025-08-01', 'competitive', 'Ryanair price adjustments detected on 15 routes, average reduction 8%', 0.92, 'high', 'critical'),
      ('2025-08-02', 'performance', 'Load factors improving on Mediterranean routes, average increase 5.2%', 0.88, 'medium', 'high'),
      ('2025-08-03', 'network', 'Capacity optimization opportunities identified on 8 underperforming routes', 0.76, 'medium', 'medium'),
      ('2025-08-04', 'competitive', 'New market entries by Wizz Air affecting LGW-WAW and STN-KRK routes', 0.95, 'high', 'critical'),
      ('2025-08-05', 'demand', 'Summer demand surge exceeding forecasts by 12% on key leisure routes', 0.89, 'high', 'high')
  `;

  // 5. Ensure alerts exist with proper data
  console.log('🚨 Ensuring competitive intelligence alerts exist...');
  const alertCount = await client`SELECT COUNT(*) as count FROM alerts`;
  
  if (alertCount[0].count === 0) {
    const testAlerts = [
      {
        priority: 'critical',
        title: 'Ryanair Price Drop Alert - LGW-BCN',
        description: 'Ryanair reduced prices by 15% on London Gatwick to Barcelona route, creating competitive pressure',
        route: 'LGW-BCN',
        agent_id: 'competitive',
        category: 'competitive',
        impact: 8.5,
        confidence: 0.92
      },
      {
        priority: 'high', 
        title: 'Load Factor Below Threshold - LTN-AMS',
        description: 'Load factor on London Luton to Amsterdam has dropped to 68%, below optimal 75% threshold',
        route: 'LTN-AMS',
        agent_id: 'performance',
        category: 'performance',
        impact: 6.8,
        confidence: 0.88
      },
      {
        priority: 'medium',
        title: 'Capacity Optimization Opportunity',
        description: 'Network analysis indicates potential for capacity reallocation from underperforming routes',
        route: 'STN-DUB',
        agent_id: 'network',
        category: 'network',
        impact: 5.2,
        confidence: 0.76
      },
      {
        priority: 'high',
        title: 'New Market Entry - Wizz Air LGW-WAW',
        description: 'Wizz Air announces new service on London Gatwick to Warsaw, creating direct competition',
        route: 'LGW-WAW',
        agent_id: 'competitive',
        category: 'competitive',
        impact: 7.3,
        confidence: 0.95
      },
      {
        priority: 'medium',
        title: 'Summer Demand Surge - Mediterranean Routes',
        description: 'Seasonal demand increase detected for Mediterranean destinations, pricing optimization recommended',
        route: 'LGW-PMI',
        agent_id: 'performance',
        category: 'performance',
        impact: 6.1,
        confidence: 0.83
      }
    ];

    for (const alert of testAlerts) {
      await client`
        INSERT INTO alerts (priority, title, description, route, impact, confidence, agent_id, metadata, status, category)
        VALUES (
          ${alert.priority}, ${alert.title}, ${alert.description}, 
          ${alert.route}, ${alert.impact}, ${alert.confidence}, ${alert.agent_id}, '{}', 'active', ${alert.category}
        )
      `;
    }
  }

  // 6. Final verification
  console.log('\n📊 FINAL VERIFICATION:');
  const [agents, alerts, insights, pricing, capacity] = await Promise.all([
    client`SELECT COUNT(*) as count FROM agents`,
    client`SELECT COUNT(*) as count FROM alerts`,
    client`SELECT COUNT(*) as count FROM intelligence_insights`,
    client`SELECT COUNT(*) as count FROM competitive_pricing`,
    client`SELECT COUNT(*) as count FROM market_capacity`
  ]);

  console.log(`✅ Agents: ${agents[0].count}`);
  console.log(`✅ Alerts: ${alerts[0].count}`);
  console.log(`✅ Intelligence Insights: ${insights[0].count}`);
  console.log(`✅ Competitive Pricing: ${pricing[0].count}`);
  console.log(`✅ Market Capacity: ${capacity[0].count}`);

  console.log('\n🎯 DEVELOPMENT DATABASE COMPLETE!');
  console.log('==================================');
  console.log('✅ All required tables and data populated');
  console.log('✅ Competitive intelligence features ready');
  console.log('✅ Isolated from production environment');

  await client.end();

} catch (error) {
  console.log(`❌ Error: ${error.message}`);
  console.log('Stack trace:', error.stack);
  await client.end();
  process.exit(1);
}