#!/usr/bin/env node

/**
 * Check Database Schema for Action Agents Tables
 */

import postgres from 'postgres';

const databaseUrl = process.env.DEV_SUP_DATABASE_URL || process.env.DATABASE_URL;
const sql = postgres(databaseUrl);

async function checkSchema() {
  try {
    console.log('🔍 Checking action_agent_metrics schema...');
    const metricsColumns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'action_agent_metrics' 
      ORDER BY ordinal_position;
    `;
    console.table(metricsColumns);

    console.log('\n🔍 Checking action_agent_configs schema...');
    const configsColumns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'action_agent_configs' 
      ORDER BY ordinal_position;
    `;
    console.table(configsColumns);

    console.log('\n🔍 Checking action_agent_executions schema...');
    const executionsColumns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'action_agent_executions' 
      ORDER BY ordinal_position;
    `;
    console.table(executionsColumns);

  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await sql.end();
  }
}

await checkSchema();