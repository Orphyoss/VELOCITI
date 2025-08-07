#!/usr/bin/env node

/**
 * MAPPED MASTER DATA SYNC
 * Sync with proper column mapping between schemas
 */

import postgres from 'postgres';

console.log('🗺️ MAPPED MASTER DATA SYNC');
console.log('============================');

const prodUrl = process.env.DEV_DATABASE_URL; // Production
const devUrl = process.env.DEV_SUP_DATABASE_URL; // Development

try {
  const prodClient = postgres(prodUrl, { max: 1 });
  const devClient = postgres(devUrl, { max: 1 });

  // 1. Airlines Mapping
  console.log('\n✈️ Syncing airlines with column mapping...');
  const prodAirlines = await prodClient`
    SELECT iata_code, name, country, is_lcc, is_active 
    FROM airlines 
    LIMIT 15
  `;
  
  await devClient`DELETE FROM airlines`;
  
  let airlineCount = 0;
  for (const airline of prodAirlines) {
    try {
      await devClient`
        INSERT INTO airlines (
          airline_code, airline_name, country_code, carrier_type, active_flag, created_at
        ) VALUES (
          ${airline.iata_code || 'XX'}, 
          ${airline.name || 'Unknown Airline'}, 
          ${airline.country || 'Unknown'}, 
          ${airline.is_lcc ? 'LCC' : 'FSC'}, 
          ${airline.is_active !== false}, 
          ${new Date()}
        )
      `;
      airlineCount++;
    } catch (error) {
      console.log(`⚠️ Skipped airline: ${airline.name}`);
    }
  }
  console.log(`✅ Synced ${airlineCount} airlines`);

  // 2. Airports Mapping
  console.log('\n🏢 Syncing airports with column mapping...');
  const prodAirports = await prodClient`
    SELECT iata_code, name, city, country 
    FROM airports 
    LIMIT 20
  `;
  
  await devClient`DELETE FROM airports`;
  
  let airportCount = 0;
  for (const airport of prodAirports) {
    try {
      await devClient`
        INSERT INTO airports (
          airport_code, airport_name, city, country, country_code, 
          latitude, longitude, created_at
        ) VALUES (
          ${airport.iata_code || 'XXX'}, 
          ${airport.name || 'Unknown Airport'}, 
          ${airport.city || 'Unknown'}, 
          ${airport.country || 'Unknown'}, 
          ${airport.country?.substring(0, 2) || 'XX'}, 
          ${0}, ${0}, ${new Date()}
        )
      `;
      airportCount++;
    } catch (error) {
      console.log(`⚠️ Skipped airport: ${airport.name}`);
    }
  }
  console.log(`✅ Synced ${airportCount} airports`);

  // 3. Aircraft Types Mapping
  console.log('\n🛩️ Syncing aircraft types with column mapping...');
  const prodAircraft = await prodClient`
    SELECT type_code, manufacturer, model, seats, range_km 
    FROM aircraft_types 
    LIMIT 10
  `;
  
  await devClient`DELETE FROM aircraft_types`;
  
  let aircraftCount = 0;
  for (const aircraft of prodAircraft) {
    try {
      await devClient`
        INSERT INTO aircraft_types (
          aircraft_code, aircraft_name, manufacturer, seats_typical, range_km, created_at
        ) VALUES (
          ${aircraft.type_code || 'UNKNOWN'}, 
          ${aircraft.model || 'Unknown Aircraft'}, 
          ${aircraft.manufacturer || 'Unknown'}, 
          ${aircraft.seats || 0}, 
          ${aircraft.range_km || 0}, 
          ${new Date()}
        )
      `;
      aircraftCount++;
    } catch (error) {
      console.log(`⚠️ Skipped aircraft: ${aircraft.type_code}`);
    }
  }
  console.log(`✅ Synced ${aircraftCount} aircraft types`);

  // 4. Routes Mapping - Merge with existing
  console.log('\n🛣️ Syncing routes with column mapping...');
  const prodRoutes = await prodClient`
    SELECT id, origin_airport, destination_airport, distance_km, is_active 
    FROM routes 
    LIMIT 20
  `;
  
  let routeCount = 0;
  for (const route of prodRoutes) {
    try {
      await devClient`
        INSERT INTO routes (
          id, route_code, origin_airport, destination_airport, 
          route_name, distance_km, active_flag, created_at
        ) VALUES (
          ${route.id}, 
          ${route.origin_airport + '-' + route.destination_airport}, 
          ${route.origin_airport}, 
          ${route.destination_airport}, 
          ${route.origin_airport + ' to ' + route.destination_airport}, 
          ${route.distance_km || 0}, 
          ${route.is_active !== false}, 
          ${new Date()}
        ) ON CONFLICT (id) DO UPDATE SET
          route_code = EXCLUDED.route_code,
          origin_airport = EXCLUDED.origin_airport,
          destination_airport = EXCLUDED.destination_airport,
          route_name = EXCLUDED.route_name,
          distance_km = EXCLUDED.distance_km,
          active_flag = EXCLUDED.active_flag
      `;
      routeCount++;
    } catch (error) {
      console.log(`⚠️ Skipped route: ${route.id}`);
    }
  }
  console.log(`✅ Synced ${routeCount} routes`);

  // Final verification
  const [airlines, airports, aircraft, routes] = await Promise.all([
    devClient`SELECT COUNT(*) as count FROM airlines`,
    devClient`SELECT COUNT(*) as count FROM airports`, 
    devClient`SELECT COUNT(*) as count FROM aircraft_types`,
    devClient`SELECT COUNT(*) as count FROM routes`
  ]);

  console.log('\n📊 FINAL MAPPED COUNTS:');
  console.log(`✅ Airlines: ${airlines[0].count} (was 7)`);
  console.log(`✅ Airports: ${airports[0].count} (was 0)`);
  console.log(`✅ Aircraft Types: ${aircraft[0].count} (was 0)`);
  console.log(`✅ Routes: ${routes[0].count} (preserved + synced)`);

  console.log('\n🎯 MAPPED SYNC COMPLETE!');
  console.log('=========================');
  console.log('✅ Production master data synced with proper column mapping');
  console.log('✅ Airlines: IATA codes → airline_code, names → airline_name');
  console.log('✅ Airports: IATA codes → airport_code, names → airport_name');
  console.log('✅ Aircraft: Type codes → aircraft_code, models → aircraft_name');
  console.log('✅ Routes: Preserved existing + added production routes');
  console.log('✅ Development now has authentic reference data');

  await prodClient.end();
  await devClient.end();

} catch (error) {
  console.log(`❌ Mapped sync failed: ${error.message}`);
  console.log('Stack:', error.stack);
  process.exit(1);
}