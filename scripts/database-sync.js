#!/usr/bin/env node

/**
 * Database Synchronization Script
 * Permanent solution for production database configuration
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema.js';

class DatabaseSynchronizer {
  constructor() {
    this.devUrl = process.env.DATABASE_URL;
    this.prodUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!this.devUrl) {
      throw new Error('DATABASE_URL not found');
    }
    
    console.log(`Development DB: ${this.devUrl.slice(0, 50)}...`);
    console.log(`Production DB: ${this.prodUrl.slice(0, 50)}...`);
    
    this.devDb = drizzle(neon(this.devUrl), { schema });
    this.prodDb = drizzle(neon(this.prodUrl), { schema });
  }

  async analyzeEnvironments() {
    console.log('\n=== DATABASE ENVIRONMENT ANALYSIS ===');
    
    try {
      // Check development database
      const devAlerts = await this.devDb.select().from(schema.alerts).limit(5);
      const devAgents = await this.devDb.select().from(schema.agents);
      
      console.log(`Development Database:`);
      console.log(`  - Alerts: ${devAlerts.length > 0 ? `${devAlerts.length}+ records` : '0 records'}`);
      console.log(`  - Agents: ${devAgents.length} agents`);
      console.log(`  - Connection: ${devAlerts.length > 0 ? 'HEALTHY' : 'EMPTY'}`);
      
      // Check production database  
      let prodAlerts, prodAgents;
      try {
        prodAlerts = await this.prodDb.select().from(schema.alerts).limit(5);
        prodAgents = await this.prodDb.select().from(schema.agents);
        
        console.log(`Production Database:`);
        console.log(`  - Alerts: ${prodAlerts.length > 0 ? `${prodAlerts.length}+ records` : '0 records'}`);
        console.log(`  - Agents: ${prodAgents.length} agents`);
        console.log(`  - Connection: ${prodAlerts.length > 0 ? 'HEALTHY' : 'EMPTY'}`);
      } catch (error) {
        console.log(`Production Database:`);
        console.log(`  - Connection: FAILED (${error.message})`);
        prodAlerts = [];
        prodAgents = [];
      }
      
      // Determine if they're the same database
      const sameDatabase = this.devUrl === this.prodUrl;
      console.log(`\nDatabase Configuration:`);
      console.log(`  - Same database instance: ${sameDatabase ? 'YES' : 'NO'}`);
      
      if (!sameDatabase && prodAlerts.length === 0) {
        console.log(`  - Issue: Production database is empty while development has data`);
        console.log(`  - Root cause: Production connects to different database instance`);
        return 'DIFFERENT_DATABASES_PROD_EMPTY';
      } else if (sameDatabase && devAlerts.length > 0) {
        console.log(`  - Status: Both environments use same populated database - HEALTHY`);
        return 'SAME_DATABASE_HEALTHY';
      } else {
        console.log(`  - Status: Configuration issue detected`);
        return 'CONFIGURATION_ISSUE';
      }
      
    } catch (error) {
      console.error('Database analysis failed:', error);
      return 'ANALYSIS_FAILED';
    }
  }

  async syncProductionDatabase() {
    console.log('\n=== PRODUCTION DATABASE SYNCHRONIZATION ===');
    
    try {
      // Ensure agents table exists and is populated
      console.log('Checking agents table...');
      let prodAgents = await this.prodDb.select().from(schema.agents);
      
      if (prodAgents.length === 0) {
        console.log('Production agents table is empty, seeding...');
        
        const devAgents = await this.devDb.select().from(schema.agents);
        if (devAgents.length > 0) {
          await this.prodDb.insert(schema.agents).values(devAgents);
          console.log(`✅ Seeded ${devAgents.length} agents to production`);
        } else {
          // Create default agents if none exist in development
          const defaultAgents = [
            {
              id: 'competitive',
              name: 'Competitive Intelligence Agent',
              status: 'active',
              accuracy: '85.00',
              totalAnalyses: 0,
              successfulPredictions: 0,
              configuration: {}
            },
            {
              id: 'performance', 
              name: 'Performance Analysis Agent',
              status: 'active',
              accuracy: '82.00',
              totalAnalyses: 0,
              successfulPredictions: 0,
              configuration: {}
            },
            {
              id: 'network',
              name: 'Network Optimization Agent', 
              status: 'active',
              accuracy: '78.00',
              totalAnalyses: 0,
              successfulPredictions: 0,
              configuration: {}
            }
          ];
          
          await this.prodDb.insert(schema.agents).values(defaultAgents);
          console.log('✅ Created default agents in production');
        }
      } else {
        console.log(`✅ Production has ${prodAgents.length} agents`);
      }
      
      // Check alerts and seed if needed
      console.log('Checking alerts table...');
      const prodAlerts = await this.prodDb.select().from(schema.alerts).limit(1);
      
      if (prodAlerts.length === 0) {
        console.log('Production alerts table is empty, checking development...');
        const devAlerts = await this.devDb.select().from(schema.alerts).limit(10);
        
        if (devAlerts.length > 0) {
          // Copy recent alerts from development
          await this.prodDb.insert(schema.alerts).values(devAlerts);
          console.log(`✅ Seeded ${devAlerts.length} alerts to production`);
        } else {
          console.log('⚠️  Development also has no alerts - database might need data generation');
        }
      } else {
        console.log('✅ Production alerts table has data');
      }
      
      return true;
    } catch (error) {
      console.error('Production sync failed:', error);
      return false;
    }
  }

  async verifyProduction() {
    console.log('\n=== PRODUCTION VERIFICATION ===');
    
    try {
      const alerts = await this.prodDb.select().from(schema.alerts).limit(5);
      const agents = await this.prodDb.select().from(schema.agents);
      
      const isHealthy = alerts.length > 0 && agents.length >= 3;
      
      console.log(`Production Database Status:`);
      console.log(`  - Alerts: ${alerts.length > 0 ? `${alerts.length}+ records` : '0 records'}`);
      console.log(`  - Agents: ${agents.length} agents`);
      console.log(`  - Overall: ${isHealthy ? 'HEALTHY ✅' : 'NEEDS ATTENTION ⚠️'}`);
      
      if (isHealthy) {
        console.log('\n🎉 Production database is now properly configured!');
        console.log('The "No Alerts in Database" issue should be resolved.');
      }
      
      return isHealthy;
    } catch (error) {
      console.error('Production verification failed:', error);
      return false;
    }
  }

  async run() {
    console.log('🔧 Database Synchronization Tool Starting...');
    
    const analysisResult = await this.analyzeEnvironments();
    
    switch (analysisResult) {
      case 'SAME_DATABASE_HEALTHY':
        console.log('\n✅ No action needed - both environments use same healthy database');
        break;
        
      case 'DIFFERENT_DATABASES_PROD_EMPTY':
        console.log('\n🔧 Fixing: Production uses different empty database');
        const syncResult = await this.syncProductionDatabase();
        if (syncResult) {
          await this.verifyProduction();
        }
        break;
        
      case 'CONFIGURATION_ISSUE':
        console.log('\n⚠️  Configuration issue detected - manual review needed');
        break;
        
      default:
        console.log('\n❌ Analysis failed - cannot proceed');
    }
  }
}

// Command line usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const sync = new DatabaseSynchronizer();
  sync.run().catch(console.error);
}

export default DatabaseSynchronizer;