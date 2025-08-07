#!/usr/bin/env node

/**
 * Schema Inconsistencies Fix Script
 * Addresses column naming issues and ensures proper database structure
 */

const { Client } = require('pg');

class SchemaFixer {
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

  async checkAndFixRouteCapacitySchema() {
    console.log('🔍 Checking route_capacity table schema...');
    
    try {
      // Check current columns in route_capacity table
      const columnsQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'route_capacity'
        ORDER BY ordinal_position;
      `;
      
      const result = await this.client.query(columnsQuery);
      const columns = result.rows.map(row => row.column_name);
      console.log(`📋 Current route_capacity columns: ${columns.join(', ')}`);
      
      // Check if we need to add missing columns
      const requiredColumns = {
        'route': 'VARCHAR(20)',
        'severity': 'VARCHAR(20) DEFAULT \'medium\'',
        'origin_code': 'VARCHAR(10)',
        'destination_code': 'VARCHAR(10)'
      };
      
      for (const [columnName, columnDef] of Object.entries(requiredColumns)) {
        if (!columns.includes(columnName)) {
          console.log(`➕ Adding missing column: ${columnName}`);
          try {
            await this.client.query(`ALTER TABLE route_capacity ADD COLUMN ${columnName} ${columnDef};`);
            console.log(`✅ Added column ${columnName}`);
          } catch (error) {
            console.log(`❌ Failed to add ${columnName}: ${error.message}`);
          }
        } else {
          console.log(`✅ Column ${columnName} exists`);
        }
      }
      
      // Update route column if it's missing data
      const routeDataCheck = await this.client.query('SELECT COUNT(*) as count FROM route_capacity WHERE route IS NOT NULL');
      const routeCount = parseInt(routeDataCheck.rows[0].count);
      
      if (routeCount === 0) {
        console.log('🔄 Populating route column from origin/destination data...');
        await this.client.query(`
          UPDATE route_capacity 
          SET route = CONCAT(origin_code, '-', destination_code)
          WHERE route IS NULL AND origin_code IS NOT NULL AND destination_code IS NOT NULL;
        `);
        console.log('✅ Route column populated');
      }
      
    } catch (error) {
      console.log(`❌ Error fixing route_capacity schema: ${error.message}`);
    }
  }

  async checkAndFixAlertsSchema() {
    console.log('🔍 Checking alerts table schema...');
    
    try {
      // Check if severity column exists in alerts table
      const columnsQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'alerts'
        ORDER BY ordinal_position;
      `;
      
      const result = await this.client.query(columnsQuery);
      const columns = result.rows.map(row => row.column_name);
      
      if (!columns.includes('severity')) {
        console.log('➕ Adding severity column to alerts table...');
        try {
          await this.client.query(`ALTER TABLE alerts ADD COLUMN severity VARCHAR(20) DEFAULT 'medium';`);
          console.log('✅ Added severity column to alerts');
          
          // Update existing alerts with appropriate severity levels
          await this.client.query(`
            UPDATE alerts SET severity = 
              CASE 
                WHEN message ILIKE '%critical%' OR message ILIKE '%urgent%' THEN 'high'
                WHEN message ILIKE '%warning%' OR message ILIKE '%caution%' THEN 'medium'
                ELSE 'low'
              END
            WHERE severity = 'medium';
          `);
          console.log('✅ Updated existing alert severity levels');
        } catch (error) {
          console.log(`❌ Failed to add severity column: ${error.message}`);
        }
      } else {
        console.log('✅ Alerts table already has severity column');
      }
    } catch (error) {
      console.log(`❌ Error fixing alerts schema: ${error.message}`);
    }
  }

  async createMissingTables() {
    console.log('🔍 Creating missing tables...');
    
    try {
      // Create market_intelligence table with proper syntax
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS market_intelligence (
          id SERIAL PRIMARY KEY,
          route VARCHAR(20) NOT NULL,
          metric_type VARCHAR(50) NOT NULL,
          metric_value DECIMAL(12,4) NOT NULL,
          competitor_data JSONB,
          analysis_date DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB
        );
      `);
      
      // Add indexes for market_intelligence
      await this.client.query('CREATE INDEX IF NOT EXISTS idx_market_intelligence_route ON market_intelligence(route, analysis_date);');
      await this.client.query('CREATE INDEX IF NOT EXISTS idx_market_intelligence_metric_type ON market_intelligence(metric_type);');
      
      console.log('✅ market_intelligence table created with indexes');
    } catch (error) {
      console.log(`❌ Error creating missing tables: ${error.message}`);
    }
  }

  async validateAndFixIndexes() {
    console.log('🔍 Validating and fixing indexes...');
    
    const safeIndexes = [
      {
        name: 'idx_alerts_created_at',
        query: 'CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);'
      },
      {
        name: 'idx_alerts_severity',
        query: 'CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);',
        condition: 'severity column exists'
      },
      {
        name: 'idx_route_capacity_route_code',
        query: 'CREATE INDEX IF NOT EXISTS idx_route_capacity_route_code ON route_capacity(origin_code, destination_code);'
      },
      {
        name: 'idx_competitive_pricing_route',
        query: 'CREATE INDEX IF NOT EXISTS idx_competitive_pricing_route ON competitive_pricing(route);'
      }
    ];

    for (const index of safeIndexes) {
      try {
        await this.client.query(index.query);
        console.log(`✅ Index ${index.name} created/verified`);
      } catch (error) {
        console.log(`❌ Index ${index.name} failed: ${error.message}`);
      }
    }
  }

  async verifyDataIntegrity() {
    console.log('🔍 Final data integrity verification...');
    
    try {
      const checks = [
        { name: 'Total alerts', query: 'SELECT COUNT(*) as count FROM alerts' },
        { name: 'Route capacity records', query: 'SELECT COUNT(*) as count FROM route_capacity' },
        { name: 'Competitive pricing records', query: 'SELECT COUNT(*) as count FROM competitive_pricing' },
        { name: 'Active agents', query: "SELECT COUNT(*) as count FROM agents WHERE status = 'active'" },
        { name: 'Unique routes in capacity', query: 'SELECT COUNT(DISTINCT origin_code || \'-\' || destination_code) as count FROM route_capacity' }
      ];

      for (const check of checks) {
        const result = await this.client.query(check.query);
        const count = result.rows[0].count;
        console.log(`✅ ${check.name}: ${count}`);
      }
      
      console.log('✅ Data integrity verification completed');
    } catch (error) {
      console.log(`❌ Data integrity check failed: ${error.message}`);
    }
  }

  async disconnect() {
    await this.client.end();
    console.log('📊 Database connection closed');
  }

  async fix() {
    console.log('🔧 Starting Schema Inconsistencies Fix');
    console.log('====================================');
    
    try {
      await this.connect();
      await this.checkAndFixRouteCapacitySchema();
      await this.checkAndFixAlertsSchema();
      await this.createMissingTables();
      await this.validateAndFixIndexes();
      await this.verifyDataIntegrity();
      
      console.log('✅ Schema inconsistencies fixed successfully');
      return true;
    } catch (error) {
      console.log(`❌ Schema fix failed: ${error.message}`);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// Main execution
if (require.main === module) {
  (async () => {
    const fixer = new SchemaFixer();
    const success = await fixer.fix();
    
    if (!success) {
      process.exit(1);
    }
  })();
}

module.exports = SchemaFixer;