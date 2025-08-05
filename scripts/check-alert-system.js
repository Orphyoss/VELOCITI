#!/usr/bin/env node

/**
 * Check Alert Generation System
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { desc, count } from 'drizzle-orm';

const databaseUrl = process.env.DEV_SUP_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found');
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function checkAlertSystem() {
  try {
    console.log('🔍 Checking Alert Generation System...');
    
    // Check total alerts
    const totalAlerts = await sql`SELECT COUNT(*) as count FROM alerts;`;
    console.log(`📊 Total alerts in database: ${totalAlerts[0].count}`);
    
    // Check latest alerts
    const latestAlerts = await sql`
      SELECT id, title, created_at, 
        EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_old
      FROM alerts 
      ORDER BY created_at DESC 
      LIMIT 10;
    `;
    
    console.log('\n📅 Latest 10 alerts:');
    console.table(latestAlerts.map(alert => ({
      id: alert.id.slice(0, 8),
      title: alert.title.slice(0, 50) + '...',
      hours_old: Math.round(alert.hours_old * 10) / 10
    })));
    
    // Check recent agent executions
    const recentExecutions = await sql`
      SELECT agent_id, created_at, alerts_generated, status
      FROM action_agent_executions 
      ORDER BY created_at DESC 
      LIMIT 10;
    `;
    
    console.log('\n🤖 Recent agent executions:');
    console.table(recentExecutions);
    
    // Check if any alerts were created in last hour
    const recentAlerts = await sql`
      SELECT COUNT(*) as count 
      FROM alerts 
      WHERE created_at > NOW() - INTERVAL '1 hour';
    `;
    
    console.log(`\n⏰ Alerts created in last hour: ${recentAlerts[0].count}`);
    
    // Test alert generation manually
    console.log('\n🧪 Testing manual alert generation...');
    
    const testAlert = {
      id: crypto.randomUUID(),
      type: 'test',
      priority: 'medium',
      title: 'Test Alert Generation',
      message: 'Testing alert system functionality',
      description: 'This is a test alert to verify the system is working',
      details: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      status: 'active',
      confidence_score: 0.95,
      priority_level: 'medium',
      resolved: false
    };
    
    await sql`
      INSERT INTO alerts (
        id, type, priority, title, message, description, details, 
        status, confidence_score, priority_level, resolved
      ) VALUES (
        ${testAlert.id}, ${testAlert.type}, ${testAlert.priority}, 
        ${testAlert.title}, ${testAlert.message}, ${testAlert.description}, 
        ${testAlert.details}, ${testAlert.status}, ${testAlert.confidence_score}, 
        ${testAlert.priority_level}, ${testAlert.resolved}
      );
    `;
    
    console.log('✅ Test alert created successfully!');
    
    // Verify test alert appears
    const verifyAlert = await sql`
      SELECT id, title, created_at 
      FROM alerts 
      WHERE id = ${testAlert.id};
    `;
    
    if (verifyAlert.length > 0) {
      console.log('✅ Test alert verified in database');
    } else {
      console.log('❌ Test alert not found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking alert system:', error);
  } finally {
    await sql.end();
  }
}

await checkAlertSystem();