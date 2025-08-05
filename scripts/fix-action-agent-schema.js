#!/usr/bin/env node

/**
 * Fix Action Agent Schema
 * Creates missing action agent tables and columns for agent execution tracking
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const databaseUrl = process.env.DEV_SUP_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found. Please set DEV_SUP_DATABASE_URL or DATABASE_URL');
  process.exit(1);
}

console.log('🔧 Fixing Action Agent Database Schema...');

const sql = postgres(databaseUrl);
const db = drizzle(sql);

async function createActionAgentTables() {
  try {
    console.log('📋 Creating action_agent_configs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS action_agent_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        class_name TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        db_tables TEXT[] NOT NULL DEFAULT '{}',
        config_params JSONB DEFAULT '{}',
        methods TEXT[] NOT NULL DEFAULT '{}',
        schedule_config JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    console.log('📊 Creating action_agent_executions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS action_agent_executions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id TEXT NOT NULL REFERENCES action_agent_configs(id),
        execution_start TIMESTAMP NOT NULL,
        execution_end TIMESTAMP,
        status TEXT NOT NULL,
        alerts_generated INTEGER DEFAULT 0,
        processing_time_ms INTEGER,
        confidence DECIMAL(5,4),
        revenue_impact DECIMAL(12,2),
        error_message TEXT,
        execution_logs JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    console.log('📈 Creating action_agent_metrics table...');
    await sql`
      CREATE TABLE IF NOT EXISTS action_agent_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id TEXT NOT NULL REFERENCES action_agent_configs(id),
        metric_date DATE NOT NULL,
        avg_processing_time INTEGER,
        success_rate DECIMAL(5,2),
        alerts_generated INTEGER DEFAULT 0,
        revenue_impact DECIMAL(12,2),
        execution_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    console.log('🔧 Inserting default action agent configurations...');
    await sql`
      INSERT INTO action_agent_configs (id, name, class_name, description, status, db_tables, methods) 
      VALUES 
        ('competitive', 'Competitive Agent', 'CompetitiveAgent', 'Analyzes competitor pricing strategies and market positioning to identify competitive opportunities and threats', 'active', '{}', '{}'),
        ('performance', 'Performance Agent', 'PerformanceAgent', 'Monitors route performance metrics and identifies optimization opportunities for network efficiency and revenue enhancement', 'active', '{}', '{}'),
        ('network', 'Network Agent', 'NetworkAgent', 'Evaluates network capacity, route profitability, and identifies expansion or optimization opportunities across the route network', 'active', '{}', '{}')
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        class_name = EXCLUDED.class_name,
        description = EXCLUDED.description,
        updated_at = NOW();
    `;

    console.log('✅ Action Agent schema fixed successfully!');
    console.log('📋 Tables created:');
    console.log('   - action_agent_configs');
    console.log('   - action_agent_executions'); 
    console.log('   - action_agent_metrics');
    console.log('🎯 Default agents configured: competitive, performance, network');

  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

await createActionAgentTables();