#!/usr/bin/env node

/**
 * POPULATE DEV_SUP_DATABASE_URL WITH TEST DATA
 * Create comprehensive test data for development
 */

import postgres from 'postgres';

console.log('🚀 POPULATING DEVELOPMENT DATABASE');
console.log('==================================');

const devSupUrl = process.env.DEV_SUP_DATABASE_URL;
if (!devSupUrl) {
  console.log('❌ DEV_SUP_DATABASE_URL not found');
  process.exit(1);
}

console.log(`Connecting to: ${devSupUrl.substring(0, 50)}...`);

const client = postgres(devSupUrl, {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
});

try {
  // 1. Create agents
  console.log('\n📊 Creating AI agents...');
  await client`
    INSERT INTO agents (id, name, status, accuracy, "totalAnalyses", "successfulPredictions", configuration, "lastActive", "updatedAt")
    VALUES 
      ('competitive', 'Competitive Intelligence', 'active', 85.7, 150, 129, '{"thresholds": {"price_change": 5.0}}', NOW(), NOW()),
      ('performance', 'Performance Attribution', 'active', 92.3, 200, 185, '{"thresholds": {"load_factor": 75.0}}', NOW(), NOW()),
      ('network', 'Network Analysis', 'active', 78.9, 100, 79, '{"thresholds": {"capacity_util": 80.0}}', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      status = EXCLUDED.status,
      accuracy = EXCLUDED.accuracy,
      "totalAnalyses" = EXCLUDED."totalAnalyses",
      "successfulPredictions" = EXCLUDED."successfulPredictions",
      configuration = EXCLUDED.configuration,
      "lastActive" = EXCLUDED."lastActive",
      "updatedAt" = EXCLUDED."updatedAt"
  `;

  // 2. Create test alerts
  console.log('🚨 Creating competitive intelligence alerts...');
  const testAlerts = [
    {
      type: 'competitive',
      priority: 'critical',
      title: 'Ryanair Price Drop Alert - LGW-BCN',
      description: 'Ryanair reduced prices by 15% on London Gatwick to Barcelona route, creating competitive pressure',
      route: 'LGW-BCN',
      route_name: 'London Gatwick - Barcelona',
      agent_id: 'competitive',
      category: 'competitive',
      metric_value: 89.50,
      threshold_value: 95.00,
      impact_score: 8.5,
      confidence: 0.92
    },
    {
      type: 'operational',
      priority: 'high', 
      title: 'Load Factor Below Threshold - LTN-AMS',
      description: 'Load factor on London Luton to Amsterdam has dropped to 68%, below optimal 75% threshold',
      route: 'LTN-AMS',
      route_name: 'London Luton - Amsterdam',
      agent_id: 'performance',
      category: 'performance',
      metric_value: 68.2,
      threshold_value: 75.0,
      impact_score: 6.8,
      confidence: 0.88
    },
    {
      type: 'network',
      priority: 'medium',
      title: 'Capacity Optimization Opportunity',
      description: 'Network analysis indicates potential for capacity reallocation from underperforming routes',
      route: 'STN-DUB',
      route_name: 'London Stansted - Dublin',
      agent_id: 'network',
      category: 'network',
      metric_value: 62.5,
      threshold_value: 70.0,
      impact_score: 5.2,
      confidence: 0.76
    },
    {
      type: 'competitive',
      priority: 'high',
      title: 'New Market Entry - Wizz Air LGW-WAW',
      description: 'Wizz Air announces new service on London Gatwick to Warsaw, creating direct competition',
      route: 'LGW-WAW',
      route_name: 'London Gatwick - Warsaw',
      agent_id: 'competitive',
      category: 'competitive',
      metric_value: 0.0,
      threshold_value: 1.0,
      impact_score: 7.3,
      confidence: 0.95
    },
    {
      type: 'demand',
      priority: 'medium',
      title: 'Summer Demand Surge - Mediterranean Routes',
      description: 'Seasonal demand increase detected for Mediterranean destinations, pricing optimization recommended',
      route: 'LGW-PMI',
      route_name: 'London Gatwick - Palma',
      agent_id: 'performance',
      category: 'performance',
      metric_value: 142.8,
      threshold_value: 120.0,
      impact_score: 6.1,
      confidence: 0.83
    }
  ];

  for (const alert of testAlerts) {
    await client`
      INSERT INTO alerts (type, priority, title, description, route, route_name, metric_value, threshold_value, impact_score, confidence, agent_id, metadata, status, category)
      VALUES (
        ${alert.type}, ${alert.priority}, ${alert.title}, ${alert.description}, 
        ${alert.route}, ${alert.route_name}, ${alert.metric_value}, ${alert.threshold_value},
        ${alert.impact_score}, ${alert.confidence}, ${alert.agent_id}, '{}', 'active', ${alert.category}
      )
    `;
  }

  // 3. Create airline data
  console.log('✈️ Creating airline reference data...');
  await client`
    INSERT INTO airlines (airline_code, airline_name, carrier_type, country_code, active_flag)
    VALUES 
      ('EZY', 'easyJet', 'LCC', 'GB', true),
      ('RYR', 'Ryanair', 'ULCC', 'IE', true),
      ('W6', 'Wizz Air', 'LCC', 'HU', true),
      ('U2', 'easyJet Europe', 'LCC', 'AT', true),
      ('VY', 'Vueling', 'LCC', 'ES', true)
    ON CONFLICT (airline_code) DO UPDATE SET
      airline_name = EXCLUDED.airline_name,
      carrier_type = EXCLUDED.carrier_type,
      country_code = EXCLUDED.country_code,
      active_flag = EXCLUDED.active_flag
  `;

  // 4. Verify data creation
  console.log('\n📊 VERIFICATION:');
  const [agentCount, alertCount, airlineCount] = await Promise.all([
    client`SELECT COUNT(*) as count FROM agents`,
    client`SELECT COUNT(*) as count FROM alerts`,
    client`SELECT COUNT(*) as count FROM airlines`
  ]);

  console.log(`✅ Agents: ${agentCount[0].count}`);
  console.log(`✅ Alerts: ${alertCount[0].count}`);
  console.log(`✅ Airlines: ${airlineCount[0].count}`);

  console.log('\n🎯 DEVELOPMENT DATABASE READY!');
  console.log('===============================');
  console.log('Your development environment now has:');
  console.log('• Test competitive intelligence alerts');
  console.log('• AI agent configurations');
  console.log('• Airline reference data');
  console.log('• Complete isolation from production');
  console.log('• Safe environment for feature development');

  await client.end();

} catch (error) {
  console.log(`❌ Error populating database: ${error.message}`);
  await client.end();
  process.exit(1);
}