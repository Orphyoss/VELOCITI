#!/usr/bin/env node

/**
 * SCHEMA AWARE SYNC
 * Dynamically discover schema and sync correctly
 */

import postgres from 'postgres';

console.log('🔍 SCHEMA AWARE MASTER DATA SYNC');
console.log('=================================');

const prodUrl = process.env.DEV_DATABASE_URL; // Production
const devUrl = process.env.DEV_SUP_DATABASE_URL; // Development

try {
  const prodClient = postgres(prodUrl, { max: 1 });
  const devClient = postgres(devUrl, { max: 1 });

  // Get schema info for key tables
  const devSchema = await devClient`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('airlines', 'airports', 'aircraft_types', 'users', 'routes')
    ORDER BY table_name, ordinal_position
  `;

  console.log('\nDEVELOPMENT SCHEMA:');
  const schemaByTable = {};
  devSchema.forEach(row => {
    if (!schemaByTable[row.table_name]) schemaByTable[row.table_name] = [];
    schemaByTable[row.table_name].push(row.column_name);
    console.log(`  ${row.table_name}.${row.column_name} (${row.data_type})`);
  });

  // Now sync with proper column awareness
  
  // 1. Airlines
  if (schemaByTable.airlines) {
    console.log('\n✈️ Syncing airlines...');
    const prodAirlines = await prodClient`SELECT * FROM airlines LIMIT 20`;
    
    // Only clear non-test data
    await devClient`DELETE FROM airlines WHERE id < 1000 OR id IS NULL`;
    
    let count = 0;
    for (const airline of prodAirlines) {
      try {
        const columns = schemaByTable.airlines.filter(col => col !== 'id' && airline[col] !== undefined);
        const values = columns.map(col => airline[col] || null);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        await devClient.unsafe(
          `INSERT INTO airlines (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
        count++;
      } catch (error) {
        // Skip conflicts
      }
    }
    console.log(`✅ ${count} airlines synced`);
  }

  // 2. Airports
  if (schemaByTable.airports) {
    console.log('\n🏢 Syncing airports...');
    const prodAirports = await prodClient`SELECT * FROM airports LIMIT 20`;
    
    await devClient`DELETE FROM airports WHERE id < 1000 OR id IS NULL`;
    
    let count = 0;
    for (const airport of prodAirports) {
      try {
        const columns = schemaByTable.airports.filter(col => col !== 'id' && airport[col] !== undefined);
        const values = columns.map(col => airport[col] || null);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        await devClient.unsafe(
          `INSERT INTO airports (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
        count++;
      } catch (error) {
        // Skip conflicts
      }
    }
    console.log(`✅ ${count} airports synced`);
  }

  // 3. Aircraft Types
  if (schemaByTable.aircraft_types) {
    console.log('\n🛩️ Syncing aircraft types...');
    const prodAircraft = await prodClient`SELECT * FROM aircraft_types LIMIT 10`;
    
    await devClient`DELETE FROM aircraft_types WHERE id < 1000 OR id IS NULL`;
    
    let count = 0;
    for (const aircraft of prodAircraft) {
      try {
        const columns = schemaByTable.aircraft_types.filter(col => col !== 'id' && aircraft[col] !== undefined);
        const values = columns.map(col => aircraft[col] || null);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        await devClient.unsafe(
          `INSERT INTO aircraft_types (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
        count++;
      } catch (error) {
        // Skip conflicts
      }
    }
    console.log(`✅ ${count} aircraft types synced`);
  }

  // 4. Users
  if (schemaByTable.users) {
    console.log('\n👤 Syncing users...');
    const prodUsers = await prodClient`SELECT * FROM users LIMIT 5`;
    
    await devClient`DELETE FROM users`;
    
    let count = 0;
    for (const user of prodUsers) {
      try {
        const columns = schemaByTable.users.filter(col => col !== 'id' && user[col] !== undefined);
        const values = columns.map(col => user[col] || null);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        await devClient.unsafe(
          `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
        count++;
      } catch (error) {
        // Skip conflicts
      }
    }
    console.log(`✅ ${count} users synced`);
  }

  // Final verification
  const [airlines, airports, aircraft, users] = await Promise.all([
    devClient`SELECT COUNT(*) as count FROM airlines`,
    devClient`SELECT COUNT(*) as count FROM airports`, 
    devClient`SELECT COUNT(*) as count FROM aircraft_types`,
    devClient`SELECT COUNT(*) as count FROM users`
  ]);

  console.log('\n📊 FINAL COUNTS:');
  console.log(`✅ Airlines: ${airlines[0].count}`);
  console.log(`✅ Airports: ${airports[0].count}`);
  console.log(`✅ Aircraft Types: ${aircraft[0].count}`);
  console.log(`✅ Users: ${users[0].count}`);

  console.log('\n🎯 SCHEMA-AWARE SYNC COMPLETE!');

  await prodClient.end();
  await devClient.end();

} catch (error) {
  console.log(`❌ Schema sync failed: ${error.message}`);
  console.log('Stack:', error.stack);
  process.exit(1);
}