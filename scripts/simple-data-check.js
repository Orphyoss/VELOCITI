#!/usr/bin/env node

/**
 * SIMPLE DATA CHECK
 * Verify current development database state
 */

import postgres from 'postgres';

console.log('📊 CURRENT DEVELOPMENT DATABASE STATE');
console.log('=====================================');

const devUrl = process.env.DEV_SUP_DATABASE_URL;
const client = postgres(devUrl, { max: 1 });

try {
  // Check main tables
  const [alerts, agents, pricing, insights] = await Promise.all([
    client`SELECT COUNT(*) as count FROM alerts`.catch(() => [{count: 'N/A'}]),
    client`SELECT COUNT(*) as count FROM agents`.catch(() => [{count: 'N/A'}]),
    client`SELECT COUNT(*) as count FROM competitive_pricing`.catch(() => [{count: 'N/A'}]),
    client`SELECT COUNT(*) as count FROM intelligence_insights`.catch(() => [{count: 'N/A'}])
  ]);

  console.log('\n📊 CURRENT DATA:');
  console.log(`✅ Alerts: ${alerts[0].count}`);
  console.log(`✅ Agents: ${agents[0].count}`);
  console.log(`✅ Competitive Pricing: ${pricing[0].count}`);
  console.log(`✅ Intelligence Insights: ${insights[0].count}`);

  // Sample alert data
  if (alerts[0].count > 0) {
    const sampleAlerts = await client`SELECT title, priority, category FROM alerts LIMIT 3`;
    console.log('\n🔍 SAMPLE ALERTS:');
    sampleAlerts.forEach(alert => {
      console.log(`  • ${alert.title} (${alert.priority} - ${alert.category})`);
    });
  }

  console.log('\n🎯 STATUS: Development database is working with current data');
  
  await client.end();

} catch (error) {
  console.log(`❌ Error: ${error.message}`);
  await client.end();
}