#!/usr/bin/env node

/**
 * Production Database Migration Script
 * Migrates real data from development to production Supabase instance
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema.ts';

class ProductionMigration {
  constructor() {
    // Development database (source)
    this.devUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL;
    
    // Production database (target) 
    this.prodUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!this.devUrl || !this.prodUrl) {
      throw new Error('Both DEV_DATABASE_URL and PROD_DATABASE_URL must be set');
    }
    
    console.log(`Source (Dev): ${this.devUrl.slice(0, 50)}...`);
    console.log(`Target (Prod): ${this.prodUrl.slice(0, 50)}...`);
    
    this.devDb = drizzle(neon(this.devUrl), { schema });
    this.prodDb = drizzle(neon(this.prodUrl), { schema });
  }

  async validateConnections() {
    console.log('\n=== VALIDATING DATABASE CONNECTIONS ===');
    
    try {
      // Test development connection
      const devTest = await this.devDb.select().from(schema.alerts).limit(1);
      console.log(`✅ Development DB: Connected (${devTest.length} sample records)`);
      
      // Test production connection
      const prodTest = await this.prodDb.select().from(schema.alerts).limit(1);
      console.log(`✅ Production DB: Connected (${prodTest.length} sample records)`);
      
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async analyzeDataToMigrate() {
    console.log('\n=== ANALYZING DATA FOR MIGRATION ===');
    
    try {
      // Count development data
      const devAlerts = await this.devDb.select().from(schema.alerts);
      const devAgents = await this.devDb.select().from(schema.agents);
      const devActivities = await this.devDb.select().from(schema.activities).limit(10);
      const devFeedback = await this.devDb.select().from(schema.feedback).limit(10);
      
      console.log(`Development Database Content:`);
      console.log(`  - Alerts: ${devAlerts.length} records`);
      console.log(`  - Agents: ${devAgents.length} records`);
      console.log(`  - Activities: ${devActivities.length}+ records`);
      console.log(`  - Feedback: ${devFeedback.length}+ records`);
      
      // Count production data
      const prodAlerts = await this.prodDb.select().from(schema.alerts);
      const prodAgents = await this.prodDb.select().from(schema.agents);
      
      console.log(`\nProduction Database Content:`);
      console.log(`  - Alerts: ${prodAlerts.length} records`);
      console.log(`  - Agents: ${prodAgents.length} records`);
      
      return {
        dev: {
          alerts: devAlerts.length,
          agents: devAgents.length,
          activities: devActivities.length,
          feedback: devFeedback.length
        },
        prod: {
          alerts: prodAlerts.length,
          agents: prodAgents.length
        }
      };
    } catch (error) {
      console.error('❌ Data analysis failed:', error.message);
      throw error;
    }
  }

  async migrateAgents() {
    console.log('\n=== MIGRATING AGENTS ===');
    
    try {
      // Get all agents from development
      const devAgents = await this.devDb.select().from(schema.agents);
      
      if (devAgents.length === 0) {
        console.log('⚠️  No agents found in development database');
        return 0;
      }
      
      // Clear existing agents in production
      await this.prodDb.delete(schema.agents);
      console.log('🗑️  Cleared existing production agents');
      
      // Insert development agents into production
      await this.prodDb.insert(schema.agents).values(devAgents);
      console.log(`✅ Migrated ${devAgents.length} agents to production`);
      
      return devAgents.length;
    } catch (error) {
      console.error('❌ Agent migration failed:', error.message);
      throw error;
    }
  }

  async migrateAlerts() {
    console.log('\n=== MIGRATING ALERTS ===');
    
    try {
      // Get all alerts from development
      const devAlerts = await this.devDb.select().from(schema.alerts);
      
      if (devAlerts.length === 0) {
        console.log('⚠️  No alerts found in development database');
        return 0;
      }
      
      console.log(`Found ${devAlerts.length} alerts in development`);
      
      // Clear existing alerts in production
      await this.prodDb.delete(schema.alerts);
      console.log('🗑️  Cleared existing production alerts');
      
      // Migrate in batches to avoid memory issues
      const batchSize = 50;
      let migratedCount = 0;
      
      for (let i = 0; i < devAlerts.length; i += batchSize) {
        const batch = devAlerts.slice(i, i + batchSize);
        await this.prodDb.insert(schema.alerts).values(batch);
        migratedCount += batch.length;
        console.log(`  📦 Migrated batch ${Math.ceil((i + 1) / batchSize)} (${migratedCount}/${devAlerts.length})`);
      }
      
      console.log(`✅ Successfully migrated ${migratedCount} alerts to production`);
      return migratedCount;
    } catch (error) {
      console.error('❌ Alert migration failed:', error.message);
      throw error;
    }
  }

  async migrateBusinessData() {
    console.log('\n=== MIGRATING BUSINESS DATA ===');
    
    try {
      // Migrate activities (user interactions)
      const devActivities = await this.devDb.select().from(schema.activities);
      if (devActivities.length > 0) {
        await this.prodDb.delete(schema.activities);
        await this.prodDb.insert(schema.activities).values(devActivities);
        console.log(`✅ Migrated ${devActivities.length} activities`);
      }
      
      // Migrate feedback (agent performance data)
      const devFeedback = await this.devDb.select().from(schema.feedback);
      if (devFeedback.length > 0) {
        await this.prodDb.delete(schema.feedback);
        await this.prodDb.insert(schema.feedback).values(devFeedback);
        console.log(`✅ Migrated ${devFeedback.length} feedback records`);
      }
      
      // Migrate intelligence insights
      try {
        const devInsights = await this.devDb.select().from(schema.intelligence_insights);
        if (devInsights.length > 0) {
          await this.prodDb.delete(schema.intelligence_insights);
          await this.prodDb.insert(schema.intelligence_insights).values(devInsights);
          console.log(`✅ Migrated ${devInsights.length} intelligence insights`);
        }
      } catch (error) {
        console.log('⚠️  Intelligence insights table not available in both databases');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Business data migration failed:', error.message);
      throw error;
    }
  }

  async verifyMigration() {
    console.log('\n=== VERIFYING MIGRATION ===');
    
    try {
      const prodAlerts = await this.prodDb.select().from(schema.alerts);
      const prodAgents = await this.prodDb.select().from(schema.agents);
      
      console.log(`Production Database After Migration:`);
      console.log(`  - Alerts: ${prodAlerts.length} records`);
      console.log(`  - Agents: ${prodAgents.length} records`);
      
      const isSuccess = prodAlerts.length > 0 && prodAgents.length >= 3;
      
      if (isSuccess) {
        console.log('\n🎉 MIGRATION SUCCESSFUL!');
        console.log('Production database now contains real development data');
        console.log('Deploy the application to complete the fix');
      } else {
        console.log('\n❌ MIGRATION INCOMPLETE');
        console.log('Production database still missing critical data');
      }
      
      return isSuccess;
    } catch (error) {
      console.error('❌ Migration verification failed:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🚀 PRODUCTION DATABASE MIGRATION STARTING...');
    console.log('='.repeat(60));
    
    try {
      // Step 1: Validate connections
      const connectionsValid = await this.validateConnections();
      if (!connectionsValid) {
        throw new Error('Database connections failed');
      }
      
      // Step 2: Analyze current data
      await this.analyzeDataToMigrate();
      
      // Step 3: Migrate core data
      await this.migrateAgents();
      await this.migrateAlerts();
      await this.migrateBusinessData();
      
      // Step 4: Verify success
      const migrationSuccess = await this.verifyMigration();
      
      if (migrationSuccess) {
        console.log('\n✅ PRODUCTION MIGRATION COMPLETE');
        console.log('The production database now has real development data');
        console.log('Ready for deployment!');
      } else {
        throw new Error('Migration verification failed');
      }
      
    } catch (error) {
      console.error('\n💥 MIGRATION FAILED:', error.message);
      console.log('\nTroubleshooting:');
      console.log('1. Verify both DATABASE_URLs are correct');
      console.log('2. Ensure production Supabase instance has schema');
      console.log('3. Check network connectivity to both databases');
      process.exit(1);
    }
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new ProductionMigration();
  migration.run().catch(console.error);
}

export default ProductionMigration;