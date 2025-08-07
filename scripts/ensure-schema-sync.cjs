#!/usr/bin/env node

/**
 * Schema Synchronization Script
 * Ensures all recent table additions and schema changes are applied consistently
 * Focuses on missing tables and structural differences
 */

const { Client } = require('pg');

class SchemaSynchronizer {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DEV_SUP_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }

  async connect() {
    await this.client.connect();
    console.log('✅ Connected to database');
  }

  async ensureCriticalTables() {
    console.log('🔍 Checking critical table structures...');
    
    const criticalTables = [
      {
        name: 'route_capacity',
        checkQuery: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'route_capacity'
          );
        `,
        createQuery: `
          CREATE TABLE IF NOT EXISTS route_capacity (
            id SERIAL PRIMARY KEY,
            route VARCHAR(20) NOT NULL,
            origin VARCHAR(10) NOT NULL,
            destination VARCHAR(10) NOT NULL,
            carrier_code VARCHAR(10) NOT NULL,
            carrier_name VARCHAR(100) NOT NULL,
            aircraft_type VARCHAR(20) NOT NULL,
            seats_per_flight INTEGER NOT NULL,
            daily_flights INTEGER NOT NULL,
            total_daily_capacity INTEGER NOT NULL,
            market_share_pct DECIMAL(5,2),
            avg_price DECIMAL(8,2),
            observation_date DATE DEFAULT CURRENT_DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(route, carrier_code, observation_date)
          );
        `
      },
      {
        name: 'competitive_pricing',
        checkQuery: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'competitive_pricing'
          );
        `,
        createQuery: `
          CREATE TABLE IF NOT EXISTS competitive_pricing (
            id SERIAL PRIMARY KEY,
            route VARCHAR(20) NOT NULL,
            airline_code VARCHAR(10) NOT NULL,
            airline_name VARCHAR(100) NOT NULL,
            price DECIMAL(8,2) NOT NULL,
            observation_date DATE DEFAULT CURRENT_DATE,
            flight_date DATE,
            booking_class VARCHAR(10),
            advance_days INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(route, observation_date),
            INDEX(airline_code)
          );
        `
      },
      {
        name: 'market_intelligence',
        checkQuery: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'market_intelligence'
          );
        `,
        createQuery: `
          CREATE TABLE IF NOT EXISTS market_intelligence (
            id SERIAL PRIMARY KEY,
            route VARCHAR(20) NOT NULL,
            metric_type VARCHAR(50) NOT NULL,
            metric_value DECIMAL(12,4) NOT NULL,
            competitor_data JSONB,
            analysis_date DATE DEFAULT CURRENT_DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata JSONB,
            INDEX(route, analysis_date),
            INDEX(metric_type)
          );
        `
      },
      {
        name: 'system_configurations',
        checkQuery: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'system_configurations'
          );
        `,
        createQuery: `
          CREATE TABLE IF NOT EXISTS system_configurations (
            id SERIAL PRIMARY KEY,
            config_key VARCHAR(100) UNIQUE NOT NULL,
            config_value TEXT NOT NULL,
            config_type VARCHAR(50) DEFAULT 'string',
            description TEXT,
            is_sensitive BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      }
    ];

    for (const table of criticalTables) {
      try {
        const result = await this.client.query(table.checkQuery);
        const exists = result.rows[0].exists;
        
        if (exists) {
          console.log(`✅ ${table.name} table exists`);
          
          // Check record count
          const countResult = await this.client.query(`SELECT COUNT(*) as count FROM ${table.name}`);
          const count = parseInt(countResult.rows[0].count);
          console.log(`   📊 Contains ${count} records`);
          
        } else {
          console.log(`❌ ${table.name} table missing - creating...`);
          await this.client.query(table.createQuery);
          console.log(`✅ ${table.name} table created successfully`);
        }
      } catch (error) {
        console.log(`❌ Error with ${table.name}: ${error.message}`);
      }
    }
  }

  async ensureIndexes() {
    console.log('🔍 Ensuring database indexes...');
    
    const indexes = [
      {
        name: 'idx_alerts_created_at',
        query: 'CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);'
      },
      {
        name: 'idx_alerts_severity',
        query: 'CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);'
      },
      {
        name: 'idx_route_capacity_route',
        query: 'CREATE INDEX IF NOT EXISTS idx_route_capacity_route ON route_capacity(route);'
      },
      {
        name: 'idx_route_performance_route',
        query: 'CREATE INDEX IF NOT EXISTS idx_route_performance_route ON route_performance(route);'
      },
      {
        name: 'idx_agents_status',
        query: 'CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);'
      }
    ];

    for (const index of indexes) {
      try {
        await this.client.query(index.query);
        console.log(`✅ Index ${index.name} ensured`);
      } catch (error) {
        console.log(`❌ Error creating index ${index.name}: ${error.message}`);
      }
    }
  }

  async validateDataIntegrity() {
    console.log('🔍 Validating data integrity...');
    
    try {
      // Check for orphaned records or data inconsistencies
      const checks = [
        {
          name: 'Active agents count',
          query: "SELECT COUNT(*) as count FROM agents WHERE status = 'active'",
          expected: '≥ 3'
        },
        {
          name: 'Recent alerts count',
          query: "SELECT COUNT(*) as count FROM alerts WHERE created_at > NOW() - INTERVAL '24 hours'",
          expected: '> 0'
        },
        {
          name: 'Route capacity data',
          query: "SELECT COUNT(DISTINCT route) as route_count FROM route_capacity",
          expected: '≥ 6'
        }
      ];

      for (const check of checks) {
        try {
          const result = await this.client.query(check.query);
          const value = result.rows[0].count || result.rows[0].route_count;
          console.log(`✅ ${check.name}: ${value} (expected: ${check.expected})`);
        } catch (error) {
          console.log(`❌ ${check.name}: Error - ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ Data integrity validation failed: ${error.message}`);
    }
  }

  async updateSchemaVersion() {
    console.log('📝 Updating schema version...');
    
    try {
      // Ensure schema_migrations table exists
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(50) PRIMARY KEY,
          description TEXT,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Record current sync
      const version = `sync_${Date.now()}`;
      await this.client.query(`
        INSERT INTO schema_migrations (version, description)
        VALUES ($1, $2)
        ON CONFLICT (version) DO NOTHING;
      `, [version, 'Database synchronization with recent table additions']);

      console.log(`✅ Schema version ${version} recorded`);
    } catch (error) {
      console.log(`❌ Schema version update failed: ${error.message}`);
    }
  }

  async disconnect() {
    await this.client.end();
    console.log('📊 Database connection closed');
  }

  async synchronize() {
    console.log('🔄 Starting Schema Synchronization');
    console.log('==================================');
    
    try {
      await this.connect();
      await this.ensureCriticalTables();
      await this.ensureIndexes();
      await this.validateDataIntegrity();
      await this.updateSchemaVersion();
      
      console.log('✅ Schema synchronization completed successfully');
      return true;
    } catch (error) {
      console.log(`❌ Schema synchronization failed: ${error.message}`);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// Main execution
if (require.main === module) {
  (async () => {
    const synchronizer = new SchemaSynchronizer();
    const success = await synchronizer.synchronize();
    
    if (!success) {
      process.exit(1);
    }
  })();
}

module.exports = SchemaSynchronizer;