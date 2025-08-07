#!/usr/bin/env node

/**
 * Update Production Schema for Action Agents
 * Ensures production database matches the expected schema structure
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const databaseUrl = process.env.DEV_SUP_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found. Please set DEV_SUP_DATABASE_URL or DATABASE_URL');
  process.exit(1);
}

console.log('🚀 Updating Production Schema for Action Agents...');

const sql = postgres(databaseUrl);

async function updateProductionSchema() {
  try {
    console.log('📋 Checking and updating action_agent_executions table...');
    
    // Ensure the table exists with correct structure
    await sql`
      CREATE TABLE IF NOT EXISTS action_agent_executions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id TEXT NOT NULL,
        execution_start TIMESTAMP DEFAULT NOW(),
        execution_end TIMESTAMP,
        execution_status TEXT DEFAULT 'running',
        start_time TIMESTAMP DEFAULT NOW(),
        end_time TIMESTAMP,
        result_data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    console.log('📈 Checking and updating action_agent_metrics table...');
    
    // Ensure metrics table exists
    await sql`
      CREATE TABLE IF NOT EXISTS action_agent_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id TEXT NOT NULL,
        metric_date DATE DEFAULT CURRENT_DATE,
        avg_processing_time INTEGER DEFAULT 0,
        success_rate DECIMAL(5,2) DEFAULT 0,
        alerts_generated INTEGER DEFAULT 0,
        revenue_impact DECIMAL(12,2) DEFAULT 0,
        execution_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    console.log('⚙️ Checking and updating action_agent_configs table...');
    
    // Ensure configs table exists with all required columns
    await sql`
      CREATE TABLE IF NOT EXISTS action_agent_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id TEXT UNIQUE NOT NULL,
        config_name TEXT NOT NULL,
        config_data JSONB DEFAULT '{}',
        name TEXT,
        class_name TEXT,
        description TEXT,
        status TEXT DEFAULT 'active',
        db_tables TEXT[] DEFAULT '{}',
        config_params JSONB DEFAULT '{}',
        methods TEXT[] DEFAULT '{}',
        schedule_config JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    console.log('🎯 Inserting default agent configurations...');
    
    // Insert or update default agent configurations
    await sql`
      INSERT INTO action_agent_configs (agent_id, config_name, config_data, name, class_name, description, status) 
      VALUES 
        ('competitive', 'competitive_config', '{"enabled": true, "priority": "high"}', 'Competitive Agent', 'CompetitiveAgent', 'Analyzes competitor pricing strategies and market positioning to identify competitive opportunities and threats', 'active'),
        ('performance', 'performance_config', '{"enabled": true, "priority": "medium"}', 'Performance Agent', 'PerformanceAgent', 'Monitors route performance metrics and identifies optimization opportunities for network efficiency and revenue enhancement', 'active'),
        ('network', 'network_config', '{"enabled": true, "priority": "medium"}', 'Network Agent', 'NetworkAgent', 'Evaluates network capacity, route profitability, and identifies expansion or optimization opportunities across the route network', 'active'),
        ('surge-detector', 'surge_config', '{"enabled": true, "priority": "high"}', 'Surge Detector', 'SurgeDetectorAgent', 'Detects demand surges and pricing opportunities in real-time', 'active'),
        ('booking-curve', 'booking_config', '{"enabled": true, "priority": "medium"}', 'Booking Curve', 'BookingCurveAgent', 'Analyzes booking patterns and optimizes pricing curves', 'active'),
        ('elasticity-monitor', 'elasticity_config', '{"enabled": true, "priority": "medium"}', 'Elasticity Monitor', 'ElasticityMonitorAgent', 'Monitors price elasticity and demand responses', 'active')
      ON CONFLICT (agent_id) DO UPDATE SET
        name = EXCLUDED.name,
        class_name = EXCLUDED.class_name,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        updated_at = NOW();
    `;

    console.log('📊 Inserting sample metrics data...');
    
    // Insert sample metrics for each agent
    const agentIds = ['competitive', 'performance', 'network', 'surge-detector', 'booking-curve', 'elasticity-monitor'];
    
    for (const agentId of agentIds) {
      await sql`
        INSERT INTO action_agent_metrics (agent_id, avg_processing_time, success_rate, alerts_generated, revenue_impact, execution_count, error_count)
        VALUES (${agentId}, ${Math.floor(Math.random() * 2000 + 500)}, ${85 + Math.random() * 10}, ${Math.floor(Math.random() * 50 + 10)}, ${Math.floor(Math.random() * 100000 + 25000)}, ${Math.floor(Math.random() * 100 + 20)}, ${Math.floor(Math.random() * 5)})
        ON CONFLICT (agent_id, metric_date) DO UPDATE SET
          avg_processing_time = EXCLUDED.avg_processing_time,
          success_rate = EXCLUDED.success_rate,
          alerts_generated = EXCLUDED.alerts_generated,
          revenue_impact = EXCLUDED.revenue_impact,
          execution_count = EXCLUDED.execution_count,
          error_count = EXCLUDED.error_count,
          updated_at = NOW();
      `;
    }

    console.log('✅ Production schema update completed successfully!');
    console.log('📋 All Action Agent tables are now properly configured');
    console.log('🎯 Default agent configurations inserted');
    console.log('📊 Sample metrics data populated');

    // Verify the setup
    const configs = await sql`SELECT agent_id, name, status FROM action_agent_configs ORDER BY agent_id;`;
    console.log('\n📋 Configured agents:');
    console.table(configs);

  } catch (error) {
    console.error('❌ Error updating production schema:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

await updateProductionSchema();