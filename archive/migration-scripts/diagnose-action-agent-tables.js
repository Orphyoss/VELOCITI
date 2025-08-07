#!/usr/bin/env node

/**
 * Diagnose Action Agent Tables
 * Check actual table structure vs expected schema
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const databaseUrl = process.env.DEV_SUP_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found. Please set DEV_SUP_DATABASE_URL or DATABASE_URL');
  process.exit(1);
}

console.log('🔍 Diagnosing Action Agent Tables...');

const sql = postgres(databaseUrl);

async function checkTables() {
  try {
    console.log('\n📋 Checking action_agent_configs table structure:');
    const configsResult = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'action_agent_configs' 
      ORDER BY ordinal_position;
    `;
    console.table(configsResult);

    console.log('\n📊 Checking action_agent_executions table structure:');
    const executionsResult = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'action_agent_executions' 
      ORDER BY ordinal_position;
    `;
    console.table(executionsResult);

    console.log('\n📈 Checking action_agent_metrics table structure:');
    const metricsResult = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'action_agent_metrics' 
      ORDER BY ordinal_position;
    `;
    console.table(metricsResult);

    console.log('\n🔍 Current data in action_agent_configs:');
    const configData = await sql`SELECT * FROM action_agent_configs LIMIT 5;`;
    console.table(configData);

    console.log('\n✅ Diagnosis complete!');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await sql.end();
  }
}

await checkTables();