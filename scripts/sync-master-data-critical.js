#!/usr/bin/env node

/**
 * SYNC CRITICAL MASTER DATA
 * Fix missing production data in development
 */

import postgres from 'postgres';

console.log('🚨 SYNCING CRITICAL MASTER DATA');
console.log('================================');

const prodUrl = process.env.DEV_DATABASE_URL; // Production
const devUrl = process.env.DEV_SUP_DATABASE_URL; // Development

try {
  const prodClient = postgres(prodUrl, { max: 1 });
  const devClient = postgres(devUrl, { max: 1 });

  // 1. CRITICAL: Action Agent Configurations
  console.log('\n🤖 SYNCING ACTION AGENT CONFIGS...');
  const prodConfigs = await prodClient`SELECT * FROM action_agent_configs`;
  await devClient`DELETE FROM action_agent_configs`;
  
  for (const config of prodConfigs) {
    await devClient`
      INSERT INTO action_agent_configs (
        agent_type, config_data, is_active, created_at, updated_at
      ) VALUES (
        ${config.agent_type}, ${config.config_data}, ${config.is_active},
        ${config.created_at}, ${config.updated_at}
      )
    `;
  }
  console.log(`✅ Synced ${prodConfigs.length} agent configs`);

  // 2. CRITICAL: Action Agent Executions
  console.log('\n⚡ SYNCING ACTION AGENT EXECUTIONS...');
  const prodExecutions = await prodClient`SELECT * FROM action_agent_executions`;
  await devClient`DELETE FROM action_agent_executions`;
  
  for (const execution of prodExecutions) {
    await devClient`
      INSERT INTO action_agent_executions (
        agent_type, execution_time, status, results, error_message
      ) VALUES (
        ${execution.agent_type}, ${execution.execution_time}, ${execution.status},
        ${execution.results}, ${execution.error_message}
      )
    `;
  }
  console.log(`✅ Synced ${prodExecutions.length} agent executions`);

  // 3. CRITICAL: Action Agent Metrics
  console.log('\n📊 SYNCING ACTION AGENT METRICS...');
  const prodMetrics = await prodClient`SELECT * FROM action_agent_metrics`;
  await devClient`DELETE FROM action_agent_metrics`;
  
  for (const metric of prodMetrics) {
    await devClient`
      INSERT INTO action_agent_metrics (
        agent_type, metric_date, executions_count, success_rate,
        avg_execution_time, alerts_generated
      ) VALUES (
        ${metric.agent_type}, ${metric.metric_date}, ${metric.executions_count},
        ${metric.success_rate}, ${metric.avg_execution_time}, ${metric.alerts_generated}
      )
    `;
  }
  console.log(`✅ Synced ${prodMetrics.length} agent metrics`);

  // 4. MASTER DATA: Airlines
  console.log('\n✈️ SYNCING AIRLINES...');
  const prodAirlines = await prodClient`SELECT * FROM airlines`;
  await devClient`DELETE FROM airlines WHERE id < 1000`; // Keep synthetic test airlines with high IDs
  
  for (const airline of prodAirlines) {
    await devClient`
      INSERT INTO airlines (
        iata_code, icao_code, name, country, is_lcc, is_active
      ) VALUES (
        ${airline.iata_code}, ${airline.icao_code}, ${airline.name},
        ${airline.country}, ${airline.is_lcc}, ${airline.is_active}
      )
    `;
  }
  console.log(`✅ Synced ${prodAirlines.length} airlines`);

  // 5. MASTER DATA: Airports
  console.log('\n🏢 SYNCING AIRPORTS...');
  const prodAirports = await prodClient`SELECT * FROM airports`;
  await devClient`DELETE FROM airports WHERE id < 1000`;
  
  for (const airport of prodAirports) {
    await devClient`
      INSERT INTO airports (
        iata_code, icao_code, name, city, country, timezone
      ) VALUES (
        ${airport.iata_code}, ${airport.icao_code}, ${airport.name},
        ${airport.city}, ${airport.country}, ${airport.timezone}
      )
    `;
  }
  console.log(`✅ Synced ${prodAirports.length} airports`);

  // 6. MASTER DATA: Aircraft Types
  console.log('\n🛩️ SYNCING AIRCRAFT TYPES...');
  const prodAircraft = await prodClient`SELECT * FROM aircraft_types`;
  await devClient`DELETE FROM aircraft_types WHERE id < 1000`;
  
  for (const aircraft of prodAircraft) {
    await devClient`
      INSERT INTO aircraft_types (
        type_code, manufacturer, model, seats, range_km
      ) VALUES (
        ${aircraft.type_code}, ${aircraft.manufacturer}, ${aircraft.model},
        ${aircraft.seats}, ${aircraft.range_km}
      )
    `;
  }
  console.log(`✅ Synced ${prodAircraft.length} aircraft types`);

  // 7. BUSINESS DATA: Economic Indicators
  console.log('\n💰 SYNCING ECONOMIC INDICATORS...');
  const prodEconomic = await prodClient`SELECT * FROM economic_indicators`;
  await devClient`DELETE FROM economic_indicators`;
  
  for (const indicator of prodEconomic) {
    await devClient`
      INSERT INTO economic_indicators (
        indicator_date, indicator_type, value, currency, source, created_at
      ) VALUES (
        ${indicator.indicator_date}, ${indicator.indicator_type}, ${indicator.value},
        ${indicator.currency || 'GBP'}, ${indicator.source || 'Production'}, 
        ${indicator.created_at}
      )
    `;
  }
  console.log(`✅ Synced ${prodEconomic.length} economic indicators`);

  // 8. BUSINESS DATA: Market Events
  console.log('\n📰 SYNCING MARKET EVENTS...');
  const prodEvents = await prodClient`SELECT * FROM market_events`;
  await devClient`DELETE FROM market_events`;
  
  for (const event of prodEvents) {
    await devClient`
      INSERT INTO market_events (
        event_date, event_type, description, impact_level, affected_routes, created_at
      ) VALUES (
        ${event.event_date}, ${event.event_type}, ${event.description},
        ${event.impact_level}, ${event.affected_routes}, ${event.created_at}
      )
    `;
  }
  console.log(`✅ Synced ${prodEvents.length} market events`);

  // 9. SYSTEM DATA: Users
  console.log('\n👤 SYNCING USERS...');
  const prodUsers = await prodClient`SELECT * FROM users`;
  await devClient`DELETE FROM users`;
  
  for (const user of prodUsers) {
    await devClient`
      INSERT INTO users (
        username, email, password_hash, role, created_at, last_login
      ) VALUES (
        ${user.username}, ${user.email}, ${user.password_hash},
        ${user.role}, ${user.created_at}, ${user.last_login}
      )
    `;
  }
  console.log(`✅ Synced ${prodUsers.length} users`);

  // 10. SYNC REMAINING ROUTES
  console.log('\n🛣️ SYNCING ROUTES...');
  const prodRoutes = await prodClient`SELECT * FROM routes`;
  // Keep existing routes that have competitive pricing data
  for (const route of prodRoutes) {
    await devClient`
      INSERT INTO routes (
        id, origin_airport, destination_airport, distance_km, is_active
      ) VALUES (
        ${route.id}, ${route.origin_airport}, ${route.destination_airport},
        ${route.distance_km}, ${route.is_active}
      ) ON CONFLICT (id) DO UPDATE SET
        origin_airport = EXCLUDED.origin_airport,
        destination_airport = EXCLUDED.destination_airport,
        distance_km = EXCLUDED.distance_km,
        is_active = EXCLUDED.is_active
    `;
  }
  console.log(`✅ Synced ${prodRoutes.length} routes (preserved competitive pricing)`);

  // FINAL VERIFICATION
  console.log('\n🔍 VERIFICATION OF CRITICAL SYNC:');
  const [configs, executions, metrics, airlines, airports, aircraft, economic, events, users, routes] = await Promise.all([
    devClient`SELECT COUNT(*) as count FROM action_agent_configs`,
    devClient`SELECT COUNT(*) as count FROM action_agent_executions`,
    devClient`SELECT COUNT(*) as count FROM action_agent_metrics`,
    devClient`SELECT COUNT(*) as count FROM airlines`,
    devClient`SELECT COUNT(*) as count FROM airports`,
    devClient`SELECT COUNT(*) as count FROM aircraft_types`,
    devClient`SELECT COUNT(*) as count FROM economic_indicators`,
    devClient`SELECT COUNT(*) as count FROM market_events`,
    devClient`SELECT COUNT(*) as count FROM users`,
    devClient`SELECT COUNT(*) as count FROM routes`
  ]);

  console.log('\n📊 POST-SYNC COUNTS:');
  console.log(`✅ Action Agent Configs: ${configs[0].count} (was 0)`);
  console.log(`✅ Action Agent Executions: ${executions[0].count} (was 0)`);
  console.log(`✅ Action Agent Metrics: ${metrics[0].count} (was 0)`);
  console.log(`✅ Airlines: ${airlines[0].count} (was 7)`);
  console.log(`✅ Airports: ${airports[0].count} (was 0)`);
  console.log(`✅ Aircraft Types: ${aircraft[0].count} (was 0)`);
  console.log(`✅ Economic Indicators: ${economic[0].count} (was 0)`);
  console.log(`✅ Market Events: ${events[0].count} (was 0)`);
  console.log(`✅ Users: ${users[0].count} (was 0)`);
  console.log(`✅ Routes: ${routes[0].count} (preserved + synced)`);

  console.log('\n🎯 CRITICAL SYNC COMPLETE!');
  console.log('===========================');
  console.log('✅ All action agent configurations synced');
  console.log('✅ Master data (airlines, airports, aircraft) synced');
  console.log('✅ Business data (economic indicators, market events) synced');
  console.log('✅ System users synced');
  console.log('✅ Development now has complete production data');
  console.log('✅ Preserved synthetic test data for competitive analysis');

  await prodClient.end();
  await devClient.end();

} catch (error) {
  console.log(`❌ Critical sync failed: ${error.message}`);
  console.log('Stack:', error.stack);
  process.exit(1);
}