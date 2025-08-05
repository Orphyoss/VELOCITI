#!/usr/bin/env node

/**
 * Force Alert Generation for Testing
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const databaseUrl = process.env.DEV_SUP_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found');
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function forceAlertGeneration() {
  try {
    console.log('🚨 Forcing Fresh Alert Generation...');
    
    const currentTime = new Date();
    const alerts = [
      {
        id: crypto.randomUUID(),
        type: 'competitive',
        priority: 'critical',
        title: 'LIVE: Ryanair Flash Sale Attack Detected',
        description: `Real-time competitive intelligence alert generated at ${currentTime.toLocaleTimeString()}. Ryanair has launched aggressive pricing on core routes.`,
        category: 'competitive',
        route: 'LGW-BCN',
        confidence: 0.94,
        agent_id: 'competitive',
        status: 'active',
        metadata: JSON.stringify({
          source: 'action_agent_test',
          timestamp: currentTime.toISOString(),
          competitor: 'Ryanair',
          urgency: 'immediate'
        })
      },
      {
        id: crypto.randomUUID(),
        type: 'performance',
        priority: 'high',
        title: 'Revenue Optimization Alert',
        description: `Performance agent detected optimization opportunity at ${currentTime.toLocaleTimeString()}. Load factor variance exceeds thresholds.`,
        category: 'performance',
        route: 'LGW-AMS',
        confidence: 0.87,
        agent_id: 'performance',
        status: 'active',
        metadata: JSON.stringify({
          source: 'action_agent_test',
          timestamp: currentTime.toISOString(),
          metric: 'load_factor',
          threshold_exceeded: true
        })
      },
      {
        id: crypto.randomUUID(),
        type: 'network',
        priority: 'medium',
        title: 'Network Capacity Alert',
        description: `Network optimization agent alert generated at ${currentTime.toLocaleTimeString()}. Route capacity utilization requires attention.`,
        category: 'network',
        route: 'STN-DUB',
        confidence: 0.82,
        agent_id: 'network',
        status: 'active',
        metadata: JSON.stringify({
          source: 'action_agent_test',
          timestamp: currentTime.toISOString(),
          metric: 'capacity_utilization',
          recommendation: 'optimize'
        })
      }
    ];
    
    // Insert all alerts
    for (const alert of alerts) {
      await sql`
        INSERT INTO alerts (
          id, type, priority, title, description, category, route, 
          confidence, agent_id, status, metadata
        ) VALUES (
          ${alert.id}, ${alert.type}, ${alert.priority}, 
          ${alert.title}, ${alert.description}, ${alert.category}, 
          ${alert.route}, ${alert.confidence}, ${alert.agent_id}, 
          ${alert.status}, ${alert.metadata}
        );
      `;
      console.log(`✅ Created ${alert.priority} alert: ${alert.title.slice(0, 40)}...`);
    }
    
    // Verify alerts appear in API
    console.log('\n🔍 Verifying alerts in API...');
    const response = await fetch('http://localhost:5000/api/alerts?limit=5');
    if (response.ok) {
      const apiAlerts = await response.json();
      console.log(`📊 API returned ${apiAlerts.length} alerts`);
      
      const freshAlerts = apiAlerts.filter(alert => {
        const alertTime = new Date(alert.created_at);
        const timeDiff = currentTime.getTime() - alertTime.getTime();
        return timeDiff < 60000; // Less than 1 minute old
      });
      
      console.log(`🎯 Found ${freshAlerts.length} fresh alerts (< 1 minute old)`);
      
      if (freshAlerts.length > 0) {
        console.log('\n🚨 Fresh alerts:');
        console.table(freshAlerts.map(alert => ({
          priority: alert.priority,
          title: alert.title.slice(0, 50) + '...',
          created: new Date(alert.created_at).toLocaleTimeString()
        })));
      }
    }
    
  } catch (error) {
    console.error('❌ Error forcing alert generation:', error);
  } finally {
    await sql.end();
  }
}

await forceAlertGeneration();