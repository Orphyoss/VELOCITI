#!/usr/bin/env node

const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: process.env.DEV_SUP_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testCapacityQuery() {
  try {
    await client.connect();
    console.log('📊 Testing route capacity query...');
    
    const requestedRoute = 'LGW-BCN';
    
    // Test the exact query from the routes file
    const capacityQuery = `
      SELECT 
        route_code,
        SUM(seats_per_flight * daily_flights) as total_daily_capacity,
        SUM(daily_flights) as total_daily_flights,
        AVG(seats_per_flight) as avg_seats_per_flight,
        COUNT(*) as carrier_count
      FROM route_capacity 
      WHERE route_code = $1
        AND active_flag = true
        AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
      GROUP BY route_code
    `;
    
    const result = await client.query(capacityQuery, [requestedRoute]);
    
    console.log('✅ Query executed successfully!');
    console.log('📈 Results:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('❌ No results found. Checking what data exists...');
      
      const allData = await client.query(`
        SELECT route_code, carrier_code, seats_per_flight, daily_flights, active_flag, effective_to 
        FROM route_capacity 
        WHERE route_code = $1
      `, [requestedRoute]);
      
      console.log('📊 Raw LGW-BCN data:', allData.rows);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testCapacityQuery();