#!/usr/bin/env node

/**
 * Test Real-time Alert Generation
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const databaseUrl = process.env.DEV_SUP_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found');
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function testAlertGeneration() {
  try {
    console.log('🧪 Testing Real-time Alert Generation...');
    
    // Create a test alert with current timestamp
    const testAlert = {
      id: crypto.randomUUID(),
      type: 'performance',
      priority: 'high',
      title: `Performance Alert Test - ${new Date().toLocaleTimeString()}`,
      description: 'Testing real-time alert generation system functionality',
      category: 'system',
      route: 'LGW-BCN',
      confidence: 0.92,
      agent_id: 'test-agent',
      status: 'active',
      metadata: JSON.stringify({ 
        test: true, 
        timestamp: new Date().toISOString(),
        source: 'manual_test'
      })
    };
    
    // Insert test alert
    await sql`
      INSERT INTO alerts (
        id, type, priority, title, description, category, route, 
        confidence, agent_id, status, metadata
      ) VALUES (
        ${testAlert.id}, ${testAlert.type}, ${testAlert.priority}, 
        ${testAlert.title}, ${testAlert.description}, ${testAlert.category}, 
        ${testAlert.route}, ${testAlert.confidence}, ${testAlert.agent_id}, 
        ${testAlert.status}, ${testAlert.metadata}
      );
    `;
    
    console.log('✅ Test alert created with ID:', testAlert.id.slice(0, 8));
    
    // Verify it appears in the latest alerts
    const latestAlert = await sql`
      SELECT id, title, created_at,
        EXTRACT(EPOCH FROM (NOW() - created_at)) as seconds_old
      FROM alerts 
      WHERE id = ${testAlert.id};
    `;
    
    if (latestAlert.length > 0) {
      console.log('✅ Test alert verified in database');
      console.log('Alert details:');
      console.table(latestAlert.map(alert => ({
        id: alert.id.slice(0, 8),
        title: alert.title.slice(0, 40),
        seconds_old: Math.round(alert.seconds_old)
      })));
    }
    
    // Test API endpoint
    console.log('\n🔗 Testing API endpoint...');
    const response = await fetch('http://localhost:5000/api/alerts?limit=1');
    if (response.ok) {
      const apiAlerts = await response.json();
      if (apiAlerts.length > 0) {
        const latestApiAlert = apiAlerts[0];
        console.log('✅ Latest alert from API:');
        console.table([{
          id: latestApiAlert.id.slice(0, 8),
          title: latestApiAlert.title.slice(0, 40),
          created: new Date(latestApiAlert.created_at).toLocaleTimeString()
        }]);
        
        if (latestApiAlert.id === testAlert.id) {
          console.log('🎯 SUCCESS: New test alert appears as latest in API!');
        } else {
          console.log('⚠️  Test alert not showing as latest - API may be cached');
        }
      }
    }
    
    // Clean up test alert
    await sql`DELETE FROM alerts WHERE id = ${testAlert.id};`;
    console.log('\n🧹 Test alert cleaned up');
    
  } catch (error) {
    console.error('❌ Error testing alert generation:', error);
  } finally {
    await sql.end();
  }
}

await testAlertGeneration();