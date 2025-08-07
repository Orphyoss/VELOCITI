#!/usr/bin/env node

/**
 * Database Schema Synchronization Tool
 * Synchronizes missing tables from production to development database
 */

import { db as prodDb } from '../server/services/supabase.js';
import postgres from 'postgres';

const DEV_DATABASE_URL = process.env.DEV_DATABASE_URL;
const PROD_DATABASE_URL = process.env.DEV_SUP_DATABASE_URL; // Our production DB

async function syncSchemas() {
  console.log('🔄 DATABASE SCHEMA SYNCHRONIZATION STARTED');
  console.log('');
  
  if (!DEV_DATABASE_URL || !PROD_DATABASE_URL) {
    console.error('❌ Missing database URLs in environment variables');
    process.exit(1);
  }
  
  const devDb = postgres(DEV_DATABASE_URL);
  const prodSql = postgres(PROD_DATABASE_URL);
  
  try {
    console.log('📋 ANALYZING MISSING TABLES...');
    
    // Get table lists from both databases
    const prodTables = await prodSql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'information_schema%'
      ORDER BY tablename
    `;
    
    const devTables = await devDb`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'information_schema%'
      ORDER BY tablename
    `;
    
    const prodTableNames = new Set(prodTables.map(t => t.tablename));
    const devTableNames = new Set(devTables.map(t => t.tablename));
    
    const missingTables = [...prodTableNames].filter(name => !devTableNames.has(name));
    
    console.log(`📊 Production DB has ${prodTableNames.size} tables`);
    console.log(`📊 Development DB has ${devTableNames.size} tables`);
    console.log(`🔍 Missing tables in development: ${missingTables.length}`);
    console.log('');
    
    if (missingTables.length === 0) {
      console.log('✅ All tables are synchronized!');
      return;
    }
    
    console.log('📝 MISSING TABLES:');
    missingTables.forEach(table => console.log(`  - ${table}`));
    console.log('');
    
    // Create missing tables by extracting schema from production
    console.log('🔧 CREATING MISSING TABLES...');
    
    for (const tableName of missingTables) {
      try {
        console.log(`  Creating table: ${tableName}`);
        
        // Get table schema from production
        const schemaQuery = await prodSql`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns
          WHERE table_name = ${tableName}
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `;
        
        if (schemaQuery.length === 0) {
          console.log(`    ⚠️  No schema found for ${tableName}, skipping`);
          continue;
        }
        
        // Build CREATE TABLE statement
        let createStatement = `CREATE TABLE ${tableName} (`;
        const columns = [];
        
        for (const col of schemaQuery) {
          let columnDef = `${col.column_name} `;
          
          // Handle data types
          if (col.data_type === 'character varying') {
            columnDef += col.character_maximum_length 
              ? `VARCHAR(${col.character_maximum_length})` 
              : 'TEXT';
          } else if (col.data_type === 'numeric') {
            columnDef += col.numeric_precision 
              ? `NUMERIC(${col.numeric_precision}${col.numeric_scale ? `,${col.numeric_scale}` : ''})` 
              : 'NUMERIC';
          } else if (col.data_type === 'timestamp without time zone') {
            columnDef += 'TIMESTAMP';
          } else if (col.data_type === 'bigint') {
            columnDef += 'BIGINT';
          } else {
            columnDef += col.data_type.toUpperCase();
          }
          
          // Handle nullable
          if (col.is_nullable === 'NO') {
            columnDef += ' NOT NULL';
          }
          
          // Handle defaults
          if (col.column_default) {
            if (col.column_default.includes('nextval')) {
              // Handle serial columns
              if (col.data_type === 'bigint') {
                columnDef = `${col.column_name} BIGSERIAL PRIMARY KEY`;
              } else {
                columnDef = `${col.column_name} SERIAL PRIMARY KEY`;
              }
            } else if (col.column_default === 'now()') {
              columnDef += ' DEFAULT NOW()';
            } else if (col.column_default === 'CURRENT_DATE') {
              columnDef += ' DEFAULT CURRENT_DATE';
            } else if (col.column_default.includes('gen_random_uuid')) {
              columnDef += ' DEFAULT gen_random_uuid()';
            }
          }
          
          columns.push(columnDef);
        }
        
        createStatement += columns.join(', ') + ')';
        
        console.log(`    SQL: ${createStatement.substring(0, 100)}...`);
        
        // Execute CREATE TABLE
        await devDb.unsafe(createStatement);
        console.log(`    ✅ Successfully created ${tableName}`);
        
      } catch (error) {
        console.log(`    ❌ Failed to create ${tableName}: ${error.message}`);
      }
    }
    
    console.log('');
    console.log('🎉 SCHEMA SYNCHRONIZATION COMPLETED');
    
    // Verify final state
    const finalDevTables = await devDb`
      SELECT COUNT(*) as count
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
    `;
    
    console.log(`📊 Development DB now has ${finalDevTables[0].count} tables`);
    
  } catch (error) {
    console.error('❌ Schema synchronization failed:', error);
    process.exit(1);
  } finally {
    await devDb.end();
    await prodSql.end();
  }
}

// Run the synchronization
syncSchemas().catch(console.error);