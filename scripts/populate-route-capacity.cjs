#!/usr/bin/env node

/**
 * Route Capacity Data Population Script
 * Populates realistic route capacity data with carriers, aircraft types, and daily flights
 * For EasyJet's 6 main European routes from London Gatwick
 */

const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: process.env.DEV_SUP_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Route data with realistic airline competition
const routeData = {
  'LGW-BCN': {
    routeName: 'London Gatwick → Barcelona',
    origin: 'LGW',
    destination: 'BCN',
    easyJet: { aircraft: 'A320', seats: 180, dailyFlights: 4 },
    competitors: [
      { carrier: 'VY', name: 'Vueling', aircraft: 'A320', seats: 180, dailyFlights: 6, marketShare: 35, avgPrice: 165 },
      { carrier: 'BA', name: 'British Airways', aircraft: 'A320', seats: 168, dailyFlights: 3, marketShare: 20, avgPrice: 195 },
      { carrier: 'FR', name: 'Ryanair', aircraft: 'B737', seats: 189, dailyFlights: 2, marketShare: 15, avgPrice: 145 },
      { carrier: 'IB', name: 'Iberia', aircraft: 'A320', seats: 176, dailyFlights: 2, marketShare: 10, avgPrice: 185 }
    ]
  },
  'LGW-AMS': {
    routeName: 'London Gatwick → Amsterdam',
    origin: 'LGW',
    destination: 'AMS',
    easyJet: { aircraft: 'A319', seats: 156, dailyFlights: 3 },
    competitors: [
      { carrier: 'KL', name: 'KLM', aircraft: 'E190', seats: 100, dailyFlights: 8, marketShare: 45, avgPrice: 195 },
      { carrier: 'BA', name: 'British Airways', aircraft: 'A320', seats: 168, dailyFlights: 4, marketShare: 25, avgPrice: 210 },
      { carrier: 'TK', name: 'Transavia', aircraft: 'B737', seats: 189, dailyFlights: 3, marketShare: 15, avgPrice: 160 }
    ]
  },
  'LGW-CDG': {
    routeName: 'London Gatwick → Paris Charles de Gaulle',
    origin: 'LGW',
    destination: 'CDG',
    easyJet: { aircraft: 'A320', seats: 180, dailyFlights: 5 },
    competitors: [
      { carrier: 'AF', name: 'Air France', aircraft: 'A320', seats: 178, dailyFlights: 6, marketShare: 40, avgPrice: 205 },
      { carrier: 'BA', name: 'British Airways', aircraft: 'A319', seats: 144, dailyFlights: 4, marketShare: 25, avgPrice: 220 },
      { carrier: 'VF', name: 'VLM Airlines', aircraft: 'F50', seats: 50, dailyFlights: 4, marketShare: 10, avgPrice: 180 }
    ]
  },
  'LGW-MAD': {
    routeName: 'London Gatwick → Madrid',
    origin: 'LGW',
    destination: 'MAD',
    easyJet: { aircraft: 'A320', seats: 180, dailyFlights: 3 },
    competitors: [
      { carrier: 'IB', name: 'Iberia', aircraft: 'A321', seats: 200, dailyFlights: 5, marketShare: 45, avgPrice: 200 },
      { carrier: 'BA', name: 'British Airways', aircraft: 'A320', seats: 168, dailyFlights: 3, marketShare: 25, avgPrice: 215 },
      { carrier: 'FR', name: 'Ryanair', aircraft: 'B737', seats: 189, dailyFlights: 2, marketShare: 15, avgPrice: 155 }
    ]
  },
  'LGW-FCO': {
    routeName: 'London Gatwick → Rome Fiumicino',
    origin: 'LGW',
    destination: 'FCO',
    easyJet: { aircraft: 'A320', seats: 180, dailyFlights: 2 },
    competitors: [
      { carrier: 'AZ', name: 'Alitalia', aircraft: 'A320', seats: 174, dailyFlights: 4, marketShare: 35, avgPrice: 190 },
      { carrier: 'BA', name: 'British Airways', aircraft: 'A320', seats: 168, dailyFlights: 2, marketShare: 25, avgPrice: 205 },
      { carrier: 'FR', name: 'Ryanair', aircraft: 'B737', seats: 189, dailyFlights: 3, marketShare: 20, avgPrice: 150 }
    ]
  },
  'LGW-MXP': {
    routeName: 'London Gatwick → Milan Malpensa',
    origin: 'LGW',
    destination: 'MXP',
    easyJet: { aircraft: 'A319', seats: 156, dailyFlights: 2 },
    competitors: [
      { carrier: 'AZ', name: 'Alitalia', aircraft: 'A319', seats: 144, dailyFlights: 3, marketShare: 30, avgPrice: 185 },
      { carrier: 'BA', name: 'British Airways', aircraft: 'A320', seats: 168, dailyFlights: 2, marketShare: 25, avgPrice: 200 },
      { carrier: 'FR', name: 'Ryanair', aircraft: 'B737', seats: 189, dailyFlights: 4, marketShare: 25, avgPrice: 145 }
    ]
  }
};

async function populateRouteCapacity() {
  try {
    await client.connect();
    console.log('📊 Connected to database, populating route capacity data...');
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS route_capacity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        route_code VARCHAR(10) NOT NULL,
        origin_airport VARCHAR(3) NOT NULL,
        destination_airport VARCHAR(3) NOT NULL,
        route_name VARCHAR(100) NOT NULL,
        carrier_code VARCHAR(3) NOT NULL,
        carrier_name VARCHAR(50) NOT NULL,
        aircraft_type VARCHAR(10) NOT NULL,
        seats_per_flight INTEGER NOT NULL,
        daily_flights INTEGER NOT NULL,
        weekly_frequency INTEGER NOT NULL,
        active_flag BOOLEAN DEFAULT true,
        effective_from DATE NOT NULL,
        effective_to DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS route_competitors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        route_code VARCHAR(10) NOT NULL,
        carrier_code VARCHAR(3) NOT NULL,
        carrier_name VARCHAR(50) NOT NULL,
        market_share_pct DECIMAL(5,2),
        avg_price DECIMAL(8,2),
        daily_capacity INTEGER,
        competitive_position VARCHAR(20),
        active_flag BOOLEAN DEFAULT true,
        last_updated TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Tables created successfully');

    // Clear existing data
    await client.query('DELETE FROM route_competitors;');
    await client.query('DELETE FROM route_capacity;');
    console.log('🗑️  Cleared existing route capacity data');
    
    let capacityInserted = 0;
    let competitorsInserted = 0;
    
    for (const [routeCode, routeInfo] of Object.entries(routeData)) {
      const effectiveFrom = '2024-01-01';
      
      // Insert easyJet capacity data
      await client.query(`
        INSERT INTO route_capacity (
          route_code, origin_airport, destination_airport, route_name, 
          carrier_code, carrier_name, aircraft_type, seats_per_flight, 
          daily_flights, weekly_frequency, active_flag, effective_from
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        routeCode, routeInfo.origin, routeInfo.destination, routeInfo.routeName,
        'EZY', 'easyJet', routeInfo.easyJet.aircraft, routeInfo.easyJet.seats,
        routeInfo.easyJet.dailyFlights, routeInfo.easyJet.dailyFlights * 7,
        true, effectiveFrom
      ]);
      capacityInserted++;
      
      // Insert easyJet as competitor (for competitive analysis)
      const easyJetMarketShare = 100 - routeInfo.competitors.reduce((sum, comp) => sum + comp.marketShare, 0);
      const easyJetDailyCapacity = routeInfo.easyJet.seats * routeInfo.easyJet.dailyFlights;
      
      await client.query(`
        INSERT INTO route_competitors (
          route_code, carrier_code, carrier_name, market_share_pct, 
          avg_price, daily_capacity, competitive_position, active_flag
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        routeCode, 'EZY', 'easyJet', easyJetMarketShare,
        172.41, easyJetDailyCapacity, 'strong', true
      ]);
      competitorsInserted++;
      
      // Insert competitor data
      for (const competitor of routeInfo.competitors) {
        // Insert competitor capacity
        await client.query(`
          INSERT INTO route_capacity (
            route_code, origin_airport, destination_airport, route_name, 
            carrier_code, carrier_name, aircraft_type, seats_per_flight, 
            daily_flights, weekly_frequency, active_flag, effective_from
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          routeCode, routeInfo.origin, routeInfo.destination, routeInfo.routeName,
          competitor.carrier, competitor.name, competitor.aircraft, competitor.seats,
          competitor.dailyFlights, competitor.dailyFlights * 7, true, effectiveFrom
        ]);
        capacityInserted++;
        
        // Insert competitor market data
        const competitivePos = competitor.marketShare > 30 ? 'strong' : 
                             competitor.marketShare > 15 ? 'neutral' : 'weak';
        
        await client.query(`
          INSERT INTO route_competitors (
            route_code, carrier_code, carrier_name, market_share_pct, 
            avg_price, daily_capacity, competitive_position, active_flag
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          routeCode, competitor.carrier, competitor.name, competitor.marketShare,
          competitor.avgPrice, competitor.seats * competitor.dailyFlights, 
          competitivePos, true
        ]);
        competitorsInserted++;
      }
      
      console.log(`✅ Populated data for route ${routeCode} (${routeInfo.routeName})`);
    }
    
    console.log(`\n🎉 Route capacity data population completed!`);
    console.log(`📈 Route capacity records inserted: ${capacityInserted}`);
    console.log(`🏆 Competitor records inserted: ${competitorsInserted}`);
    console.log(`🛫 Total routes covered: ${Object.keys(routeData).length}`);
    
    // Display summary statistics
    const capacitySummary = await client.query(`
      SELECT 
        route_code,
        COUNT(*) as carrier_count,
        SUM(daily_flights) as total_daily_flights,
        SUM(seats_per_flight * daily_flights) as total_daily_capacity
      FROM route_capacity 
      GROUP BY route_code 
      ORDER BY route_code
    `);
    
    console.log('\n📊 Route Capacity Summary:');
    console.log('Route'.padEnd(8) + 'Carriers'.padEnd(10) + 'Daily Flights'.padEnd(15) + 'Daily Capacity');
    console.log('-'.repeat(50));
    
    for (const row of capacitySummary.rows) {
      console.log(
        row.route_code.padEnd(8) + 
        row.carrier_count.toString().padEnd(10) + 
        row.total_daily_flights.toString().padEnd(15) + 
        row.total_daily_capacity.toString()
      );
    }
    
  } catch (error) {
    console.error('❌ Error populating route capacity data:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
if (require.main === module) {
  populateRouteCapacity()
    .then(() => {
      console.log('\n🚀 Route capacity population script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { populateRouteCapacity };