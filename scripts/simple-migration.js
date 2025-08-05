#!/usr/bin/env node

/**
 * Simple Production Database Migration
 * Uses direct PostgreSQL connections to migrate data
 */

const { Client } = require('pg');

async function migrateData() {
  console.log('🚀 STARTING PRODUCTION DATABASE MIGRATION');
  console.log('='.repeat(50));
  
  const devUrl = process.env.DEV_DATABASE_URL;
  const prodUrl = process.env.DATABASE_URL;
  
  if (!devUrl || !prodUrl) {
    console.error('❌ Missing database URLs');
    console.log('DEV_DATABASE_URL:', devUrl ? 'Present' : 'Missing');
    console.log('DATABASE_URL:', prodUrl ? 'Present' : 'Missing');
    process.exit(1);
  }
  
  console.log('Database URLs configured:');
  console.log('DEV:', devUrl.slice(0, 50) + '...');
  console.log('PROD:', prodUrl.slice(0, 50) + '...');
  
  const devClient = new Client({ connectionString: devUrl });
  const prodClient = new Client({ connectionString: prodUrl });
  
  try {
    // Connect to both databases
    console.log('\n📡 Connecting to databases...');
    await devClient.connect();
    await prodClient.connect();
    console.log('✅ Both databases connected');
    
    // Check development data
    console.log('\n📊 Analyzing development data...');
    const devAlerts = await devClient.query('SELECT COUNT(*) as count FROM alerts');
    const devAgents = await devClient.query('SELECT COUNT(*) as count FROM agents');
    
    console.log(`Development database:`);
    console.log(`  - Alerts: ${devAlerts.rows[0].count}`);
    console.log(`  - Agents: ${devAgents.rows[0].count}`);
    
    if (devAlerts.rows[0].count === '0') {
      console.log('❌ No data found in development database!');
      process.exit(1);
    }
    
    // Check production data (should be empty)
    console.log('\n📊 Checking production database...');
    const prodAlerts = await prodClient.query('SELECT COUNT(*) as count FROM alerts');
    const prodAgents = await prodClient.query('SELECT COUNT(*) as count FROM agents');
    
    console.log(`Production database:`);
    console.log(`  - Alerts: ${prodAlerts.rows[0].count}`);
    console.log(`  - Agents: ${prodAgents.rows[0].count}`);
    
    // Migrate agents first
    console.log('\n🔄 Migrating agents...');
    const agentData = await devClient.query('SELECT * FROM agents');
    
    if (agentData.rows.length > 0) {
      // Clear existing agents
      await prodClient.query('DELETE FROM agents');
      
      // Insert agents one by one
      for (const agent of agentData.rows) {
        await prodClient.query(`
          INSERT INTO agents (id, name, description, is_active, threshold_config, performance_metrics, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          agent.id,
          agent.name,
          agent.description,
          agent.is_active,
          agent.threshold_config,
          agent.performance_metrics,
          agent.created_at,
          agent.updated_at
        ]);
      }
      console.log(`✅ Migrated ${agentData.rows.length} agents`);
    }
    
    // Migrate alerts in batches
    console.log('\n🔄 Migrating alerts...');
    const alertData = await devClient.query('SELECT * FROM alerts ORDER BY id');
    
    if (alertData.rows.length > 0) {
      // Clear existing alerts
      await prodClient.query('DELETE FROM alerts');
      
      // Insert alerts in batches
      const batchSize = 50;
      let migratedCount = 0;
      
      for (let i = 0; i < alertData.rows.length; i += batchSize) {
        const batch = alertData.rows.slice(i, i + batchSize);
        
        for (const alert of batch) {
          await prodClient.query(`
            INSERT INTO alerts (title, description, category, subcategory, priority, status, agent_id, metadata, business_impact, recommended_actions, created_at, updated_at, resolved_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [
            alert.title,
            alert.description,
            alert.category,
            alert.subcategory,
            alert.priority,
            alert.status,
            alert.agent_id,
            alert.metadata,
            alert.business_impact,
            alert.recommended_actions,
            alert.created_at,
            alert.updated_at,
            alert.resolved_at
          ]);
        }
        
        migratedCount += batch.length;
        console.log(`  📦 Migrated batch ${Math.ceil((i + 1) / batchSize)} (${migratedCount}/${alertData.rows.length})`);
      }
      
      console.log(`✅ Successfully migrated ${migratedCount} alerts`);
    }
    
    // Migrate other data
    console.log('\n🔄 Migrating additional data...');
    
    // Activities
    try {
      const activityData = await devClient.query('SELECT * FROM activities');
      if (activityData.rows.length > 0) {
        await prodClient.query('DELETE FROM activities');
        for (const activity of activityData.rows) {
          await prodClient.query(`
            INSERT INTO activities (user_id, action, details, timestamp)
            VALUES ($1, $2, $3, $4)
          `, [activity.user_id, activity.action, activity.details, activity.timestamp]);
        }
        console.log(`✅ Migrated ${activityData.rows.length} activities`);
      }
    } catch (error) {
      console.log('⚠️  Activities migration skipped:', error.message);
    }
    
    // Feedback
    try {
      const feedbackData = await devClient.query('SELECT * FROM feedback');
      if (feedbackData.rows.length > 0) {
        await prodClient.query('DELETE FROM feedback');
        for (const feedback of feedbackData.rows) {
          await prodClient.query(`
            INSERT INTO feedback (alert_id, user_id, rating, comment, created_at)
            VALUES ($1, $2, $3, $4, $5)
          `, [feedback.alert_id, feedback.user_id, feedback.rating, feedback.comment, feedback.created_at]);
        }
        console.log(`✅ Migrated ${feedbackData.rows.length} feedback records`);
      }
    } catch (error) {
      console.log('⚠️  Feedback migration skipped:', error.message);
    }
    
    // Verify final results
    console.log('\n✅ MIGRATION VERIFICATION');
    const finalAlerts = await prodClient.query('SELECT COUNT(*) as count FROM alerts');
    const finalAgents = await prodClient.query('SELECT COUNT(*) as count FROM agents');
    
    console.log(`Production database after migration:`);
    console.log(`  - Alerts: ${finalAlerts.rows[0].count}`);
    console.log(`  - Agents: ${finalAgents.rows[0].count}`);
    
    const success = parseInt(finalAlerts.rows[0].count) > 0 && parseInt(finalAgents.rows[0].count) >= 3;
    
    if (success) {
      console.log('\n🎉 MIGRATION SUCCESSFUL!');
      console.log('Production database now has real development data');
      console.log('Ready for deployment!');
    } else {
      throw new Error('Migration verification failed - insufficient data in production');
    }
    
  } catch (error) {
    console.error('\n💥 MIGRATION FAILED:', error.message);
    process.exit(1);
  } finally {
    await devClient.end();
    await prodClient.end();
  }
}

// Run migration
migrateData().catch(console.error);