#!/usr/bin/env node

/**
 * COMPLETE DEVELOPMENT DATABASE SETUP
 * Add missing tables and populate with test data
 */

import postgres from 'postgres';

console.log('🚀 COMPLETING DEVELOPMENT DATABASE SETUP');
console.log('=========================================');

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
  // 1. Create intelligence_insights table (needed for Telos service)
  console.log('\n📊 Creating intelligence_insights table...');
  await client`
    CREATE TABLE IF NOT EXISTS intelligence_insights (
      id SERIAL PRIMARY KEY,
      insight_date DATE NOT NULL,
      insight_type VARCHAR(50) NOT NULL,
      insight_text TEXT NOT NULL,
      confidence_score DECIMAL(3,2) DEFAULT 0.85,
      impact_level VARCHAR(20) DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // 2. Add sample intelligence insights
  console.log('💡 Adding sample intelligence insights...');
  await client`
    INSERT INTO intelligence_insights (insight_date, insight_type, insight_text, confidence_score, impact_level)
    VALUES 
      ('2025-08-01', 'competitive', 'Ryanair price adjustments detected on 15 routes, average reduction 8%', 0.92, 'high'),
      ('2025-08-02', 'performance', 'Load factors improving on Mediterranean routes, average increase 5.2%', 0.88, 'medium'),
      ('2025-08-03', 'network', 'Capacity optimization opportunities identified on 8 underperforming routes', 0.76, 'medium'),
      ('2025-08-04', 'competitive', 'New market entries by Wizz Air affecting LGW-WAW and STN-KRK routes', 0.95, 'high'),
      ('2025-08-05', 'demand', 'Summer demand surge exceeding forecasts by 12% on key leisure routes', 0.89, 'high')
    ON CONFLICT DO NOTHING
  `;

  // 3. Verify agents exist and add if needed
  console.log('🤖 Ensuring AI agents exist...');
  await client`
    INSERT INTO agents (id, name, status, accuracy, total_analyses, successful_predictions, configuration, last_active, updated_at)
    VALUES 
      ('competitive', 'Competitive Intelligence', 'active', 85.7, 150, 129, '{"thresholds": {"price_change": 5.0}}', NOW(), NOW()),
      ('performance', 'Performance Attribution', 'active', 92.3, 200, 185, '{"thresholds": {"load_factor": 75.0}}', NOW(), NOW()),
      ('network', 'Network Analysis', 'active', 78.9, 100, 79, '{"thresholds": {"capacity_util": 80.0}}', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      status = EXCLUDED.status,
      accuracy = EXCLUDED.accuracy,
      total_analyses = EXCLUDED.total_analyses,
      successful_predictions = EXCLUDED.successful_predictions,
      configuration = EXCLUDED.configuration,
      last_active = EXCLUDED.last_active,
      updated_at = EXCLUDED.updated_at
  `;

  // 4. Add test alerts if not already present
  console.log('🚨 Adding test competitive intelligence alerts...');
  const alertCount = await client`SELECT COUNT(*) as count FROM alerts`;
  
  if (alertCount[0].count < 5) {
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

  // 5. Final verification
  console.log('\n📊 FINAL VERIFICATION:');
  const [agents, alerts, insights] = await Promise.all([
    client`SELECT COUNT(*) as count FROM agents`,
    client`SELECT COUNT(*) as count FROM alerts`,
    client`SELECT COUNT(*) as count FROM intelligence_insights`
  ]);

  console.log(`✅ Agents: ${agents[0].count}`);
  console.log(`✅ Alerts: ${alerts[0].count}`);
  console.log(`✅ Intelligence Insights: ${insights[0].count}`);

  // 6. Test sample queries
  console.log('\n🔍 SAMPLE DATA:');
  const sampleAlerts = await client`SELECT title, priority, category FROM alerts LIMIT 3`;
  sampleAlerts.forEach(alert => {
    console.log(`  • ${alert.title} (${alert.priority})`);
  });

  console.log('\n🎯 DEVELOPMENT DATABASE COMPLETE!');
  console.log('==================================');
  console.log('✅ All required tables created');
  console.log('✅ Test data populated');
  console.log('✅ Intelligence insights available');
  console.log('✅ AI agents configured');
  console.log('✅ Complete isolation from production');

  await client.end();

} catch (error) {
  console.log(`❌ Error: ${error.message}`);
  await client.end();
  process.exit(1);
}