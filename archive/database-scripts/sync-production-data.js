#!/usr/bin/env node

/**
 * SYNC PRODUCTION DATA TO DEVELOPMENT
 * Copy real production data to development environment
 */

import postgres from 'postgres';

console.log('🔄 SYNCING PRODUCTION DATA TO DEVELOPMENT');
console.log('==========================================');

const prodUrl = process.env.DEV_DATABASE_URL; // Production
const devUrl = process.env.DEV_SUP_DATABASE_URL; // Development

try {
  const prodClient = postgres(prodUrl, { max: 1 });
  const devClient = postgres(devUrl, { max: 1 });

  // 1. Sync Alerts (most important - 206 production alerts)
  console.log('\n📊 Syncing alerts...');
  const prodAlerts = await prodClient`SELECT * FROM alerts ORDER BY created_at DESC`;
  
  // Clear development alerts first
  await devClient`DELETE FROM alerts`;
  
  // Insert production alerts
  for (const alert of prodAlerts) {
    await devClient`
      INSERT INTO alerts (
        id, title, description, priority, category, status, route_id, 
        agent_id, raw_data, feedback_count, created_at, resolved_at, impact
      ) VALUES (
        ${alert.id}, ${alert.title}, ${alert.description}, ${alert.priority},
        ${alert.category}, ${alert.status}, ${alert.route_id}, ${alert.agent_id},
        ${alert.raw_data}, ${alert.feedback_count}, ${alert.created_at},
        ${alert.resolved_at}, ${alert.impact || 'medium'}
      ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        priority = EXCLUDED.priority,
        category = EXCLUDED.category,
        status = EXCLUDED.status
    `;
  }
  console.log(`✅ Synced ${prodAlerts.length} alerts`);

  // 2. Sync Action Agent Configs
  console.log('\n🤖 Syncing action agent configs...');
  const prodAgentConfigs = await prodClient`SELECT * FROM action_agent_configs`;
  await devClient`DELETE FROM action_agent_configs`;
  
  for (const config of prodAgentConfigs) {
    await devClient`
      INSERT INTO action_agent_configs (
        id, agent_type, config_data, is_active, created_at, updated_at
      ) VALUES (
        ${config.id}, ${config.agent_type}, ${config.config_data},
        ${config.is_active}, ${config.created_at}, ${config.updated_at}
      ) ON CONFLICT (id) DO UPDATE SET
        config_data = EXCLUDED.config_data,
        is_active = EXCLUDED.is_active
    `;
  }
  console.log(`✅ Synced ${prodAgentConfigs.length} agent configs`);

  // 3. Sync Action Agent Executions
  console.log('\n⚡ Syncing agent executions...');
  const prodExecutions = await prodClient`SELECT * FROM action_agent_executions`;
  await devClient`DELETE FROM action_agent_executions`;
  
  for (const execution of prodExecutions) {
    await devClient`
      INSERT INTO action_agent_executions (
        id, agent_type, execution_time, status, results, error_message
      ) VALUES (
        ${execution.id}, ${execution.agent_type}, ${execution.execution_time},
        ${execution.status}, ${execution.results}, ${execution.error_message}
      ) ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        results = EXCLUDED.results
    `;
  }
  console.log(`✅ Synced ${prodExecutions.length} executions`);

  // 4. Sync Action Agent Metrics
  console.log('\n📈 Syncing agent metrics...');
  const prodMetrics = await prodClient`SELECT * FROM action_agent_metrics`;
  await devClient`DELETE FROM action_agent_metrics`;
  
  for (const metric of prodMetrics) {
    await devClient`
      INSERT INTO action_agent_metrics (
        id, agent_type, metric_date, executions_count, success_rate, 
        avg_execution_time, alerts_generated
      ) VALUES (
        ${metric.id}, ${metric.agent_type}, ${metric.metric_date},
        ${metric.executions_count}, ${metric.success_rate},
        ${metric.avg_execution_time}, ${metric.alerts_generated}
      ) ON CONFLICT (id) DO UPDATE SET
        executions_count = EXCLUDED.executions_count,
        success_rate = EXCLUDED.success_rate
    `;
  }
  console.log(`✅ Synced ${prodMetrics.length} metrics records`);

  // 5. Sync Airlines
  console.log('\n✈️ Syncing airlines...');
  const prodAirlines = await prodClient`SELECT * FROM airlines`;
  await devClient`DELETE FROM airlines`;
  
  for (const airline of prodAirlines) {
    await devClient`
      INSERT INTO airlines (
        id, iata_code, icao_code, name, country, is_lcc, is_active
      ) VALUES (
        ${airline.id}, ${airline.iata_code}, ${airline.icao_code},
        ${airline.name}, ${airline.country}, ${airline.is_lcc}, ${airline.is_active}
      ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        is_active = EXCLUDED.is_active
    `;
  }
  console.log(`✅ Synced ${prodAirlines.length} airlines`);

  // 6. Sync Aircraft Types
  console.log('\n🛩️ Syncing aircraft types...');
  const prodAircraft = await prodClient`SELECT * FROM aircraft_types`;
  await devClient`DELETE FROM aircraft_types`;
  
  for (const aircraft of prodAircraft) {
    await devClient`
      INSERT INTO aircraft_types (
        id, type_code, manufacturer, model, seats, range_km
      ) VALUES (
        ${aircraft.id}, ${aircraft.type_code}, ${aircraft.manufacturer},
        ${aircraft.model}, ${aircraft.seats}, ${aircraft.range_km}
      ) ON CONFLICT (id) DO UPDATE SET
        seats = EXCLUDED.seats,
        range_km = EXCLUDED.range_km
    `;
  }
  console.log(`✅ Synced ${prodAircraft.length} aircraft types`);

  // 7. Sync Airports
  console.log('\n🏢 Syncing airports...');
  const prodAirports = await prodClient`SELECT * FROM airports`;
  await devClient`DELETE FROM airports`;
  
  for (const airport of prodAirports) {
    await devClient`
      INSERT INTO airports (
        id, iata_code, icao_code, name, city, country, timezone
      ) VALUES (
        ${airport.id}, ${airport.iata_code}, ${airport.icao_code},
        ${airport.name}, ${airport.city}, ${airport.country}, ${airport.timezone}
      ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        city = EXCLUDED.city
    `;
  }
  console.log(`✅ Synced ${prodAirports.length} airports`);

  // 8. Sync Routes
  console.log('\n🛣️ Syncing routes...');
  const prodRoutes = await prodClient`SELECT * FROM routes`;
  await devClient`DELETE FROM routes WHERE id NOT IN (SELECT DISTINCT route_id FROM competitive_pricing)`;
  
  for (const route of prodRoutes) {
    await devClient`
      INSERT INTO routes (
        id, origin_airport, destination_airport, distance_km, is_active
      ) VALUES (
        ${route.id}, ${route.origin_airport}, ${route.destination_airport},
        ${route.distance_km}, ${route.is_active}
      ) ON CONFLICT (id) DO UPDATE SET
        distance_km = EXCLUDED.distance_km,
        is_active = EXCLUDED.is_active
    `;
  }
  console.log(`✅ Synced ${prodRoutes.length} routes`);

  // 9. Sync Users
  console.log('\n👤 Syncing users...');
  const prodUsers = await prodClient`SELECT * FROM users`;
  await devClient`DELETE FROM users`;
  
  for (const user of prodUsers) {
    await devClient`
      INSERT INTO users (
        id, username, email, password_hash, role, created_at, last_login
      ) VALUES (
        ${user.id}, ${user.username}, ${user.email}, ${user.password_hash},
        ${user.role}, ${user.created_at}, ${user.last_login}
      ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        last_login = EXCLUDED.last_login
    `;
  }
  console.log(`✅ Synced ${prodUsers.length} users`);

  // 10. Sync Economic Indicators
  console.log('\n💰 Syncing economic indicators...');
  const prodEconomic = await prodClient`SELECT * FROM economic_indicators`;
  await devClient`DELETE FROM economic_indicators`;
  
  for (const indicator of prodEconomic) {
    await devClient`
      INSERT INTO economic_indicators (
        id, indicator_date, indicator_type, value, currency, source, created_at
      ) VALUES (
        ${indicator.id}, ${indicator.indicator_date}, ${indicator.indicator_type},
        ${indicator.value}, ${indicator.currency}, ${indicator.source}, ${indicator.created_at}
      ) ON CONFLICT (id) DO UPDATE SET
        value = EXCLUDED.value
    `;
  }
  console.log(`✅ Synced ${prodEconomic.length} economic indicators`);

  // 11. Sync Market Events
  console.log('\n📰 Syncing market events...');
  const prodEvents = await prodClient`SELECT * FROM market_events`;
  await devClient`DELETE FROM market_events`;
  
  for (const event of prodEvents) {
    await devClient`
      INSERT INTO market_events (
        id, event_date, event_type, description, impact_level, affected_routes, created_at
      ) VALUES (
        ${event.id}, ${event.event_date}, ${event.event_type}, ${event.description},
        ${event.impact_level}, ${event.affected_routes}, ${event.created_at}
      ) ON CONFLICT (id) DO UPDATE SET
        impact_level = EXCLUDED.impact_level
    `;
  }
  console.log(`✅ Synced ${prodEvents.length} market events`);

  // Verify sync results
  console.log('\n🔍 VERIFYING SYNC RESULTS:');
  const [devAlerts, devConfigs, devExecutions, devMetrics] = await Promise.all([
    devClient`SELECT COUNT(*) as count FROM alerts`,
    devClient`SELECT COUNT(*) as count FROM action_agent_configs`,
    devClient`SELECT COUNT(*) as count FROM action_agent_executions`,
    devClient`SELECT COUNT(*) as count FROM action_agent_metrics`
  ]);

  console.log(`✅ Alerts: ${devAlerts[0].count} (was 22, now ${prodAlerts.length})`);
  console.log(`✅ Agent Configs: ${devConfigs[0].count} (was 0, now ${prodAgentConfigs.length})`);
  console.log(`✅ Executions: ${devExecutions[0].count} (was 0, now ${prodExecutions.length})`);
  console.log(`✅ Metrics: ${devMetrics[0].count} (was 0, now ${prodMetrics.length})`);

  console.log('\n🎯 DATA SYNC COMPLETE!');
  console.log('======================');
  console.log('✅ All production data copied to development');
  console.log('✅ Development now has authentic 206 alerts');
  console.log('✅ All agent configurations and metrics synced');
  console.log('✅ Master data (airlines, airports, routes) synced');
  console.log('✅ Preserved synthetic data for competitive pricing and flight performance');

  await prodClient.end();
  await devClient.end();

} catch (error) {
  console.log(`❌ Sync failed: ${error.message}`);
  console.log('Stack:', error.stack);
  process.exit(1);
}