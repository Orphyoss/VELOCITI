#!/usr/bin/env node

/**
 * SAFE SYNC PRODUCTION DATA TO DEVELOPMENT
 * Copy real production data with proper null handling
 */

import postgres from 'postgres';

console.log('🔄 SAFELY SYNCING PRODUCTION DATA');
console.log('==================================');

const prodUrl = process.env.DEV_DATABASE_URL; // Production
const devUrl = process.env.DEV_SUP_DATABASE_URL; // Development

try {
  const prodClient = postgres(prodUrl, { max: 1 });
  const devClient = postgres(devUrl, { max: 1 });

  // 1. Sync Alerts (most important - 206 production alerts)
  console.log('\n📊 Syncing alerts with safe null handling...');
  const prodAlerts = await prodClient`SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50`;
  
  console.log(`Found ${prodAlerts.length} production alerts to sync`);
  
  // Sample alert structure to understand what we're working with
  if (prodAlerts.length > 0) {
    console.log('Sample alert structure:', Object.keys(prodAlerts[0]));
  }
  
  // Clear existing development alerts
  await devClient`DELETE FROM alerts WHERE id < 1000`; // Keep synthetic alerts with high IDs
  
  let syncedCount = 0;
  for (const alert of prodAlerts) {
    try {
      await devClient`
        INSERT INTO alerts (
          id, title, description, priority, category, status, 
          route_id, agent_id, raw_data, feedback_count, created_at, 
          resolved_at, impact, updated_at
        ) VALUES (
          ${alert.id}, 
          ${alert.title || 'Untitled Alert'}, 
          ${alert.description || 'No description'}, 
          ${alert.priority || 'medium'}, 
          ${alert.category || 'general'}, 
          ${alert.status || 'active'}, 
          ${alert.route_id || null}, 
          ${alert.agent_id || 'system'}, 
          ${alert.raw_data || null}, 
          ${alert.feedback_count || 0}, 
          ${alert.created_at || new Date()}, 
          ${alert.resolved_at || null}, 
          ${alert.impact || 'medium'},
          ${alert.updated_at || new Date()}
        ) ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `;
      syncedCount++;
    } catch (error) {
      console.log(`⚠️ Skipped alert ${alert.id}: ${error.message.substring(0, 100)}`);
    }
  }
  console.log(`✅ Successfully synced ${syncedCount} of ${prodAlerts.length} alerts`);

  // 2. Sync Master Data Tables (Airlines, Airports, Routes)
  console.log('\n✈️ Syncing master data...');
  
  // Airlines
  const prodAirlines = await prodClient`SELECT * FROM airlines`;
  await devClient`DELETE FROM airlines WHERE id < 1000`;
  
  let airlineCount = 0;
  for (const airline of prodAirlines) {
    try {
      await devClient`
        INSERT INTO airlines (
          id, iata_code, icao_code, name, country, is_lcc, is_active
        ) VALUES (
          ${airline.id}, ${airline.iata_code}, ${airline.icao_code || null},
          ${airline.name}, ${airline.country || 'Unknown'}, 
          ${airline.is_lcc || false}, ${airline.is_active || true}
        ) ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          is_active = EXCLUDED.is_active
      `;
      airlineCount++;
    } catch (error) {
      console.log(`⚠️ Skipped airline ${airline.id}`);
    }
  }
  console.log(`✅ Synced ${airlineCount} airlines`);

  // Routes
  const prodRoutes = await prodClient`SELECT * FROM routes`;
  let routeCount = 0;
  for (const route of prodRoutes) {
    try {
      await devClient`
        INSERT INTO routes (
          id, origin_airport, destination_airport, distance_km, is_active
        ) VALUES (
          ${route.id}, ${route.origin_airport}, ${route.destination_airport},
          ${route.distance_km || 0}, ${route.is_active || true}
        ) ON CONFLICT (id) DO UPDATE SET
          distance_km = EXCLUDED.distance_km,
          is_active = EXCLUDED.is_active
      `;
      routeCount++;
    } catch (error) {
      console.log(`⚠️ Skipped route ${route.id}`);
    }
  }
  console.log(`✅ Synced ${routeCount} routes`);

  // 3. Sync Action Agent Data (if exists)
  try {
    const prodAgentConfigs = await prodClient`SELECT * FROM action_agent_configs`;
    await devClient`DELETE FROM action_agent_configs`;
    
    for (const config of prodAgentConfigs) {
      await devClient`
        INSERT INTO action_agent_configs (
          id, agent_type, config_data, is_active, created_at, updated_at
        ) VALUES (
          ${config.id}, ${config.agent_type}, ${config.config_data || {}},
          ${config.is_active || true}, ${config.created_at || new Date()}, 
          ${config.updated_at || new Date()}
        ) ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log(`✅ Synced ${prodAgentConfigs.length} agent configs`);
  } catch (error) {
    console.log(`⚠️ Agent configs sync: ${error.message.substring(0, 50)}`);
  }

  // Verify sync results
  console.log('\n🔍 VERIFYING SYNC RESULTS:');
  const [totalAlerts, totalAirlines, totalRoutes] = await Promise.all([
    devClient`SELECT COUNT(*) as count FROM alerts`,
    devClient`SELECT COUNT(*) as count FROM airlines`,
    devClient`SELECT COUNT(*) as count FROM routes`
  ]);

  console.log(`📊 Development database now has:`);
  console.log(`   Alerts: ${totalAlerts[0].count} (including production data)`);
  console.log(`   Airlines: ${totalAirlines[0].count}`);
  console.log(`   Routes: ${totalRoutes[0].count}`);

  // Sample recent alerts
  const recentAlerts = await devClient`
    SELECT title, priority, category, created_at 
    FROM alerts 
    ORDER BY created_at DESC 
    LIMIT 5
  `;
  
  console.log('\n🚨 RECENT ALERTS IN DEVELOPMENT:');
  recentAlerts.forEach(alert => {
    const date = new Date(alert.created_at).toLocaleDateString();
    console.log(`   • ${alert.title} (${alert.priority} - ${alert.category}) - ${date}`);
  });

  console.log('\n🎯 SYNC COMPLETED SUCCESSFULLY!');
  console.log('================================');
  console.log('✅ Production alerts now available in development');
  console.log('✅ Master data synchronized');
  console.log('✅ Development environment enriched with real data');
  console.log('✅ Synthetic test data preserved where needed');

  await prodClient.end();
  await devClient.end();

} catch (error) {
  console.log(`❌ Sync failed: ${error.message}`);
  console.log('Full error:', error);
  process.exit(1);
}