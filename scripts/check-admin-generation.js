#!/usr/bin/env node

/**
 * Check Admin Data Generation System
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const databaseUrl = process.env.DEV_SUP_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found');
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function checkAdminGeneration() {
  try {
    console.log('🔍 Checking Admin Data Generation...');
    
    // Check the alerts table schema
    const alertsSchema = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'alerts' 
      ORDER BY ordinal_position;
    `;
    
    console.log('\n📋 Alerts table schema:');
    console.table(alertsSchema);
    
    // Check for any alert generation API endpoints
    console.log('\n🧪 Testing alert generation endpoint...');
    
    const response = await fetch('http://localhost:5000/api/generate-data');
    if (response.ok) {
      const result = await response.text();
      console.log('✅ Generate data endpoint accessible');
      console.log('Response preview:', result.slice(0, 200));
    } else {
      console.log('❌ Generate data endpoint not accessible:', response.status);
    }
    
    // Check recent alert timestamps
    const alertTimings = await sql`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as alert_count
      FROM alerts 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY hour DESC;
    `;
    
    console.log('\n📊 Alert generation by hour (last 24h):');
    console.table(alertTimings);
    
    // Check the most recent alerts with full details
    const recentAlertsDetailed = await sql`
      SELECT id, title, priority_level, created_at,
        EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_old
      FROM alerts 
      ORDER BY created_at DESC 
      LIMIT 5;
    `;
    
    console.log('\n🕐 Most recent alerts (detailed):');
    console.table(recentAlertsDetailed.map(alert => ({
      id: alert.id.slice(0, 8),
      title: alert.title.slice(0, 40) + '...',
      priority: alert.priority_level,
      minutes_old: Math.round(alert.minutes_old)
    })));
    
  } catch (error) {
    console.error('❌ Error checking admin generation:', error);
  } finally {
    await sql.end();
  }
}

await checkAdminGeneration();