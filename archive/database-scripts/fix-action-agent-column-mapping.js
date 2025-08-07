#!/usr/bin/env node

/**
 * Fix Action Agent Column Mapping
 * Updates the actual database tables to match the expected schema
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const databaseUrl = process.env.DEV_SUP_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found. Please set DEV_SUP_DATABASE_URL or DATABASE_URL');
  process.exit(1);
}

console.log('🔧 Fixing Action Agent Column Mapping...');

const sql = postgres(databaseUrl);

async function fixColumnMapping() {
  try {
    console.log('📋 Adding missing columns to action_agent_executions...');
    
    // Add missing columns to action_agent_executions if they don't exist
    try {
      await sql`ALTER TABLE action_agent_executions ADD COLUMN IF NOT EXISTS execution_start TIMESTAMP;`;
      await sql`ALTER TABLE action_agent_executions ADD COLUMN IF NOT EXISTS execution_end TIMESTAMP;`;
      await sql`ALTER TABLE action_agent_executions ADD COLUMN IF NOT EXISTS status TEXT;`;
      await sql`ALTER TABLE action_agent_executions ADD COLUMN IF NOT EXISTS alerts_generated INTEGER DEFAULT 0;`;
      await sql`ALTER TABLE action_agent_executions ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;`;
      await sql`ALTER TABLE action_agent_executions ADD COLUMN IF NOT EXISTS confidence DECIMAL(5,4);`;
      await sql`ALTER TABLE action_agent_executions ADD COLUMN IF NOT EXISTS revenue_impact DECIMAL(12,2);`;
      await sql`ALTER TABLE action_agent_executions ADD COLUMN IF NOT EXISTS execution_logs JSONB DEFAULT '[]';`;
      console.log('✅ Added missing columns to action_agent_executions');
    } catch (error) {
      console.log('ℹ️ Some columns may already exist:', error.message);
    }

    console.log('📈 Adding missing columns to action_agent_metrics...');
    
    // Add missing columns to action_agent_metrics if they don't exist
    try {
      await sql`ALTER TABLE action_agent_metrics ADD COLUMN IF NOT EXISTS avg_processing_time INTEGER;`;
      await sql`ALTER TABLE action_agent_metrics ADD COLUMN IF NOT EXISTS success_rate DECIMAL(5,2);`;
      await sql`ALTER TABLE action_agent_metrics ADD COLUMN IF NOT EXISTS alerts_generated INTEGER DEFAULT 0;`;
      await sql`ALTER TABLE action_agent_metrics ADD COLUMN IF NOT EXISTS revenue_impact DECIMAL(12,2);`;
      await sql`ALTER TABLE action_agent_metrics ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0;`;
      await sql`ALTER TABLE action_agent_metrics ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;`;
      console.log('✅ Added missing columns to action_agent_metrics');
    } catch (error) {
      console.log('ℹ️ Some columns may already exist:', error.message);
    }

    console.log('📋 Updating action_agent_configs structure...');
    
    // Add missing columns to action_agent_configs
    try {
      await sql`ALTER TABLE action_agent_configs ADD COLUMN IF NOT EXISTS name TEXT;`;
      await sql`ALTER TABLE action_agent_configs ADD COLUMN IF NOT EXISTS class_name TEXT;`;
      await sql`ALTER TABLE action_agent_configs ADD COLUMN IF NOT EXISTS description TEXT;`;
      await sql`ALTER TABLE action_agent_configs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';`;
      await sql`ALTER TABLE action_agent_configs ADD COLUMN IF NOT EXISTS db_tables TEXT[] DEFAULT '{}';`;
      await sql`ALTER TABLE action_agent_configs ADD COLUMN IF NOT EXISTS config_params JSONB DEFAULT '{}';`;
      await sql`ALTER TABLE action_agent_configs ADD COLUMN IF NOT EXISTS methods TEXT[] DEFAULT '{}';`;
      await sql`ALTER TABLE action_agent_configs ADD COLUMN IF NOT EXISTS schedule_config JSONB DEFAULT '{}';`;
      console.log('✅ Added missing columns to action_agent_configs');
    } catch (error) {
      console.log('ℹ️ Some columns may already exist:', error.message);
    }

    console.log('🎯 Inserting/updating default agent configurations...');
    
    // Use existing agent_id as primary key and add the required data
    await sql`
      INSERT INTO action_agent_configs (agent_id, name, class_name, description, status, db_tables, methods) 
      VALUES 
        ('competitive', 'Competitive Agent', 'CompetitiveAgent', 'Analyzes competitor pricing strategies and market positioning to identify competitive opportunities and threats', 'active', '{}', '{}'),
        ('performance', 'Performance Agent', 'PerformanceAgent', 'Monitors route performance metrics and identifies optimization opportunities for network efficiency and revenue enhancement', 'active', '{}', '{}'),
        ('network', 'Network Agent', 'NetworkAgent', 'Evaluates network capacity, route profitability, and identifies expansion or optimization opportunities across the route network', 'active', '{}', '{}')
      ON CONFLICT (agent_id) DO UPDATE SET
        name = EXCLUDED.name,
        class_name = EXCLUDED.class_name,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        updated_at = NOW();
    `;

    console.log('✅ Action Agent column mapping fixed successfully!');
    console.log('📋 Tables updated with correct schema');
    console.log('🎯 Default agents configured: competitive, performance, network');

  } catch (error) {
    console.error('❌ Error fixing column mapping:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

await fixColumnMapping();