// Debug script to check the actual database schema
import { db } from './server/services/supabase.js';
import { sql } from 'drizzle-orm';

async function checkTableSchemas() {
    const tables = [
        'competitive_pricing',
        'market_capacity', 
        'web_search_data',
        'rm_pricing_actions',
        'flight_performance',
        'market_events',
        'economic_indicators',
        'intelligence_insights'
    ];

    console.log('🔍 ACTUAL DATABASE SCHEMA CHECK');
    console.log('=' * 50);

    for (const table of tables) {
        try {
            console.log(`\n📊 TABLE: ${table}`);
            
            // Get column information
            const result = await db.execute(sql`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = ${table}
                ORDER BY ordinal_position
            `);
            
            if (result.length > 0) {
                console.log('  Columns:');
                result.forEach(col => {
                    console.log(`    - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
                });
            } else {
                console.log('  ❌ Table does not exist or no columns found');
            }
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
        }
    }
    
    process.exit(0);
}

checkTableSchemas().catch(console.error);