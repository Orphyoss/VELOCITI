#!/usr/bin/env node

/**
 * SMART DATA SYNC
 * Intelligently map production data to development schema
 */

import postgres from 'postgres';

console.log('🧠 SMART DATA SYNC WITH SCHEMA MAPPING');
console.log('=======================================');

const prodUrl = process.env.DEV_DATABASE_URL; // Production
const devUrl = process.env.DEV_SUP_DATABASE_URL; // Development

try {
  const prodClient = postgres(prodUrl, { max: 1 });
  const devClient = postgres(devUrl, { max: 1 });

  // 1. Get the latest alert ID in development to avoid conflicts
  const maxIdResult = await devClient`SELECT COALESCE(MAX(id), 0) as max_id FROM alerts`;
  let nextId = parseInt(maxIdResult[0].max_id) + 1;

  console.log(`\n📊 Starting alert sync from ID ${nextId}...`);

  // 2. Get production alerts with their actual schema
  const prodAlerts = await prodClient`
    SELECT * FROM alerts 
    ORDER BY created_at DESC 
    LIMIT 100
  `;
  
  console.log(`Found ${prodAlerts.length} production alerts`);
  console.log('Production schema:', Object.keys(prodAlerts[0] || {}));

  // 3. Map production alerts to development schema
  let syncedCount = 0;
  for (const prodAlert of prodAlerts) {
    try {
      // Map production fields to development fields
      const mappedAlert = {
        id: nextId++,
        title: prodAlert.title || 'Production Alert',
        description: prodAlert.description || 'Imported from production',
        priority: prodAlert.priority || 'medium',
        category: prodAlert.category || 'competitive',
        status: prodAlert.status || 'active',
        route_id: prodAlert.route || prodAlert.route_name || null,
        agent_id: prodAlert.agent_id || 'competitive',
        raw_data: prodAlert.metadata || {},
        feedback_count: 0,
        created_at: prodAlert.created_at || new Date(),
        resolved_at: prodAlert.resolved_at || null,
        impact: mapImpact(prodAlert.impact_score),
        updated_at: new Date()
      };

      await devClient`
        INSERT INTO alerts (
          id, title, description, priority, category, status,
          route_id, agent_id, raw_data, feedback_count, created_at,
          resolved_at, impact, updated_at
        ) VALUES (
          ${mappedAlert.id}, ${mappedAlert.title}, ${mappedAlert.description},
          ${mappedAlert.priority}, ${mappedAlert.category}, ${mappedAlert.status},
          ${mappedAlert.route_id}, ${mappedAlert.agent_id}, ${mappedAlert.raw_data},
          ${mappedAlert.feedback_count}, ${mappedAlert.created_at},
          ${mappedAlert.resolved_at}, ${mappedAlert.impact}, ${mappedAlert.updated_at}
        )
      `;
      syncedCount++;
    } catch (error) {
      console.log(`⚠️ Skipped alert: ${error.message.substring(0, 100)}`);
    }
  }

  console.log(`✅ Successfully synced ${syncedCount} production alerts`);

  // 4. Verify the sync
  const [totalAlerts, recentAlerts] = await Promise.all([
    devClient`SELECT COUNT(*) as count FROM alerts`,
    devClient`
      SELECT title, priority, category, created_at 
      FROM alerts 
      ORDER BY id DESC 
      LIMIT 5
    `
  ]);

  console.log(`\n📊 Development database now has ${totalAlerts[0].count} total alerts`);
  
  console.log('\n🚨 LATEST SYNCED ALERTS:');
  recentAlerts.forEach(alert => {
    const date = new Date(alert.created_at).toLocaleDateString();
    console.log(`   • ${alert.title} (${alert.priority} - ${alert.category}) - ${date}`);
  });

  console.log('\n🎯 SMART SYNC COMPLETED!');
  console.log('=========================');
  console.log(`✅ ${syncedCount} production alerts now in development`);
  console.log('✅ Schema differences handled automatically');
  console.log('✅ Development environment enriched with real data');
  console.log('✅ No conflicts with existing synthetic data');

  await prodClient.end();
  await devClient.end();

} catch (error) {
  console.log(`❌ Smart sync failed: ${error.message}`);
  console.log('Stack:', error.stack);
  process.exit(1);
}

// Helper function to map impact scores to categories
function mapImpact(impactScore) {
  if (typeof impactScore === 'number') {
    if (impactScore >= 80) return 'high';
    if (impactScore >= 60) return 'medium';
    return 'low';
  }
  return 'medium';
}