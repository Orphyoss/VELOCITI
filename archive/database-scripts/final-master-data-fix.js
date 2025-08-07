#!/usr/bin/env node

/**
 * FINAL MASTER DATA FIX
 * Simple direct copy without ID conflicts
 */

import postgres from 'postgres';

console.log('🎯 FINAL MASTER DATA FIX');
console.log('=========================');

const prodUrl = process.env.DEV_DATABASE_URL; // Production
const devUrl = process.env.DEV_SUP_DATABASE_URL; // Development

try {
  const prodClient = postgres(prodUrl, { max: 1 });
  const devClient = postgres(devUrl, { max: 1 });

  // Clear and sync airlines
  console.log('\n✈️ Airlines...');
  const prodAirlines = await prodClient`SELECT iata_code, icao_code, name, country, is_lcc, is_active FROM airlines`;
  await devClient`DELETE FROM airlines`;
  
  for (const airline of prodAirlines) {
    await devClient`
      INSERT INTO airlines (iata_code, icao_code, name, country, is_lcc, is_active)
      VALUES (${airline.iata_code}, ${airline.icao_code}, ${airline.name}, 
              ${airline.country}, ${airline.is_lcc}, ${airline.is_active})
    `;
  }
  console.log(`✅ ${prodAirlines.length} airlines`);

  // Clear and sync airports  
  console.log('\n🏢 Airports...');
  const prodAirports = await prodClient`SELECT iata_code, icao_code, name, city, country, timezone FROM airports`;
  await devClient`DELETE FROM airports`;
  
  for (const airport of prodAirports) {
    await devClient`
      INSERT INTO airports (iata_code, icao_code, name, city, country, timezone)
      VALUES (${airport.iata_code}, ${airport.icao_code}, ${airport.name},
              ${airport.city}, ${airport.country}, ${airport.timezone})
    `;
  }
  console.log(`✅ ${prodAirports.length} airports`);

  // Sync aircraft types
  console.log('\n🛩️ Aircraft types...');
  const prodAircraft = await prodClient`SELECT type_code, manufacturer, model, seats, range_km FROM aircraft_types`;
  await devClient`DELETE FROM aircraft_types`;
  
  for (const aircraft of prodAircraft) {
    await devClient`
      INSERT INTO aircraft_types (type_code, manufacturer, model, seats, range_km)
      VALUES (${aircraft.type_code}, ${aircraft.manufacturer}, ${aircraft.model},
              ${aircraft.seats}, ${aircraft.range_km})
    `;
  }
  console.log(`✅ ${prodAircraft.length} aircraft types`);

  // Sync users
  console.log('\n👤 Users...');
  const prodUsers = await prodClient`SELECT username, email, password_hash, role, created_at, last_login FROM users`;
  await devClient`DELETE FROM users`;
  
  for (const user of prodUsers) {
    await devClient`
      INSERT INTO users (username, email, password_hash, role, created_at, last_login)
      VALUES (${user.username}, ${user.email}, ${user.password_hash},
              ${user.role}, ${user.created_at}, ${user.last_login})
    `;
  }
  console.log(`✅ ${prodUsers.length} users`);

  console.log('\n🎯 MASTER DATA FIXED!');
  
  await prodClient.end();
  await devClient.end();

} catch (error) {
  console.log(`❌ Fix failed: ${error.message}`);
  process.exit(1);
}