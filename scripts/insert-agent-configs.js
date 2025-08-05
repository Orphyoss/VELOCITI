#!/usr/bin/env node

/**
 * Insert Agent Configurations
 * Add the default agent configurations to the database
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const databaseUrl = process.env.DEV_SUP_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found');
  process.exit(1);
}

console.log('🎯 Inserting Agent Configurations...');

const sql = postgres(databaseUrl);

async function insertAgentConfigs() {
  try {
    // Clear existing configs first
    await sql`DELETE FROM action_agent_configs;`;
    
    // Insert the three agent configurations including config_name and config_data
    await sql`
      INSERT INTO action_agent_configs (agent_id, config_name, config_data, name, class_name, description, status, db_tables, methods) 
      VALUES 
        ('competitive', 'competitive_config', '{"enabled": true, "priority": "high"}', 'Competitive Agent', 'CompetitiveAgent', 'Analyzes competitor pricing strategies and market positioning to identify competitive opportunities and threats', 'active', '{}', '{}'),
        ('performance', 'performance_config', '{"enabled": true, "priority": "medium"}', 'Performance Agent', 'PerformanceAgent', 'Monitors route performance metrics and identifies optimization opportunities for network efficiency and revenue enhancement', 'active', '{}', '{}'),
        ('network', 'network_config', '{"enabled": true, "priority": "medium"}', 'Network Agent', 'NetworkAgent', 'Evaluates network capacity, route profitability, and identifies expansion or optimization opportunities across the route network', 'active', '{}', '{}');
    `;

    console.log('✅ Agent configurations inserted successfully!');
    
    // Verify the insertion
    const configs = await sql`SELECT agent_id, name, status FROM action_agent_configs;`;
    console.log('📋 Configured agents:');
    console.table(configs);

  } catch (error) {
    console.error('❌ Error inserting configurations:', error);
  } finally {
    await sql.end();
  }
}

await insertAgentConfigs();