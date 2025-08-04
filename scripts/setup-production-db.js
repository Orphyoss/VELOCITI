#!/usr/bin/env node

/**
 * Production Database Setup Script
 * Ensures production database has proper schema and sample data
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('🔄 Setting up production database...');
console.log('📡 Database URL:', databaseUrl.substring(0, 30) + '...');

// Create postgres client with production settings
const client = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  ssl: 'require',
  prepare: false,
});

const db = drizzle(client, { schema });

async function setupProductionDatabase() {
  try {
    console.log('🔍 Checking existing data...');
    
    // Check if tables exist and have data
    const alertCount = await client`SELECT COUNT(*) as count FROM alerts`;
    const agentCount = await client`SELECT COUNT(*) as count FROM agents`;
    
    console.log(`📊 Current database state:`);
    console.log(`   Alerts: ${alertCount[0].count}`);
    console.log(`   Agents: ${agentCount[0].count}`);
    
    // Ensure essential agents exist
    const requiredAgents = [
      {
        id: 'competitive',
        name: 'Competitive Intelligence Agent',
        status: 'active',
        accuracy: '85.5',
        totalAnalyses: 1247,
        successfulPredictions: 1066,
        configuration: { threshold: 0.05, monitoring_frequency: 'hourly' },
        lastActive: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'performance',
        name: 'Route Performance Agent', 
        status: 'active',
        accuracy: '89.2',
        totalAnalyses: 892,
        successfulPredictions: 796,
        configuration: { variance_threshold: 0.03, lookback_days: 7 },
        lastActive: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'network',
        name: 'Network Optimization Agent',
        status: 'active', 
        accuracy: '78.9',
        totalAnalyses: 634,
        successfulPredictions: 500,
        configuration: { efficiency_threshold: 0.02, analysis_depth: 'comprehensive' },
        lastActive: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log('🤖 Ensuring required agents exist...');
    for (const agent of requiredAgents) {
      try {
        await client`
          INSERT INTO agents (id, name, status, accuracy, "totalAnalyses", "successfulPredictions", configuration, "lastActive", "updatedAt")
          VALUES (${agent.id}, ${agent.name}, ${agent.status}, ${agent.accuracy}, ${agent.totalAnalyses}, ${agent.successfulPredictions}, ${JSON.stringify(agent.configuration)}, ${agent.lastActive}, ${agent.updatedAt})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            status = EXCLUDED.status,
            accuracy = EXCLUDED.accuracy,
            "totalAnalyses" = EXCLUDED."totalAnalyses",
            "successfulPredictions" = EXCLUDED."successfulPredictions",
            configuration = EXCLUDED.configuration,
            "lastActive" = EXCLUDED."lastActive",
            "updatedAt" = EXCLUDED."updatedAt"
        `;
        console.log(`   ✅ Agent: ${agent.name}`);
      } catch (error) {
        console.log(`   ⚠️  Agent ${agent.name}: ${error.message}`);
      }
    }

    // Create sample alerts if database is empty
    if (parseInt(alertCount[0].count) === 0) {
      console.log('📝 Creating sample alerts for production...');
      
      const sampleAlerts = [
        {
          id: 'alert-prod-1',
          type: 'competitive',
          priority: 'high',
          message: 'Price undercut detected on LGW-BCN route - competitor 12% below EasyJet pricing',
          details: JSON.stringify({
            route: 'LGW-BCN',
            competitor: 'Vueling',
            priceGap: '12%',
            recommendation: 'Consider dynamic pricing adjustment'
          }),
          status: 'active',
          agentId: 'competitive',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'alert-prod-2', 
          type: 'performance',
          priority: 'medium',
          message: 'Load factor declined 8% on AMS routes - demand analysis required',
          details: JSON.stringify({
            route: 'LGW-AMS',
            loadFactorChange: '-8%',
            period: 'last 7 days',
            recommendation: 'Review capacity allocation'
          }),
          status: 'active',
          agentId: 'performance',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'alert-prod-3',
          type: 'network',
          priority: 'high',
          message: 'Slot optimization opportunity identified at CDG - potential 15% efficiency gain',
          details: JSON.stringify({
            airport: 'CDG',
            opportunity: 'Slot reallocation',
            potentialGain: '15%',
            recommendation: 'Coordinate with slot management'
          }),
          status: 'active',
          agentId: 'network',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const alert of sampleAlerts) {
        try {
          await client`
            INSERT INTO alerts (id, type, priority, message, details, status, "agentId", "createdAt", "updatedAt")
            VALUES (${alert.id}, ${alert.type}, ${alert.priority}, ${alert.message}, ${alert.details}, ${alert.status}, ${alert.agentId}, ${alert.createdAt}, ${alert.updatedAt})
            ON CONFLICT (id) DO NOTHING
          `;
          console.log(`   ✅ Alert: ${alert.message.substring(0, 50)}...`);
        } catch (error) {
          console.log(`   ⚠️  Alert creation: ${error.message}`);
        }
      }
    }

    // Final verification
    const finalAlertCount = await client`SELECT COUNT(*) as count FROM alerts`;
    const finalAgentCount = await client`SELECT COUNT(*) as count FROM agents`;
    
    console.log('\n✅ Production database setup complete!');
    console.log(`📊 Final state:`);
    console.log(`   Alerts: ${finalAlertCount[0].count}`);
    console.log(`   Agents: ${finalAgentCount[0].count}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

setupProductionDatabase().then(success => {
  process.exit(success ? 0 : 1);
});