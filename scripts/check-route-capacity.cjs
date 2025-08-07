#!/usr/bin/env node

const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: process.env.DEV_SUP_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkRouteCapacity() {
  try {
    await client.connect();
    console.log('📊 Connected to database, checking route capacity data...');
    
    // Check if tables exist
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('route_capacity', 'route_competitors')
    `);
    
    console.log('✅ Tables found:', tablesCheck.rows.map(r => r.table_name));
    
    // Check total records
    const totalRecords = await client.query('SELECT COUNT(*) as total FROM route_capacity');
    console.log('📈 Total route_capacity records:', totalRecords.rows[0].total);
    
    // Check LGW-BCN specifically 
    const lgwBcnData = await client.query(`
      SELECT 
        route_code,
        SUM(seats_per_flight * daily_flights) as total_daily_capacity,
        SUM(daily_flights) as total_daily_flights,
        AVG(seats_per_flight) as avg_seats_per_flight,
        COUNT(*) as carrier_count
      FROM route_capacity 
      WHERE route_code = 'LGW-BCN'
        AND active_flag = true
        AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
      GROUP BY route_code
    `);
    
    if (lgwBcnData.rows.length > 0) {
      console.log('✅ LGW-BCN capacity data found:', lgwBcnData.rows[0]);
    } else {
      console.log('❌ No data found for LGW-BCN');
      
      // Show all routes available
      const availableRoutes = await client.query('SELECT DISTINCT route_code FROM route_capacity ORDER BY route_code');
      console.log('📍 Available routes:', availableRoutes.rows.map(r => r.route_code));
    }
    
    // Check competitors table too
    const competitors = await client.query('SELECT COUNT(*) as total FROM route_competitors');
    console.log('🏆 Total route_competitors records:', competitors.rows[0].total);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkRouteCapacity();