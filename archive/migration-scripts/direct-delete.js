#!/usr/bin/env node
/**
 * Direct delete of accuracy alerts using PostgreSQL client
 */

import postgres from 'postgres';

async function deleteAccuracyAlerts() {
  try {
    console.log('[DELETE] Connecting to database...');
    
    // Get database URL from environment - same as the main application
    const databaseUrl = process.env.DEV_SUP_DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('❌ DEV_SUP_DATABASE_URL environment variable is required');
      process.exit(1);
    }
    
    console.log(`[DELETE] Using database: ${databaseUrl.substring(0, 30)}...`);
    
    // Create postgres client with same configuration as main app
    const sql = postgres(databaseUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 30,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : undefined,
      prepare: false,
    });
    
    try {
      // First, count total alerts
      const totalResult = await sql`
        SELECT COUNT(*) as count FROM intelligence_insights;
      `;
      console.log(`[DELETE] Total alerts in database: ${totalResult[0].count}`);

      // Count accuracy alerts
      const accuracyCountResult = await sql`
        SELECT COUNT(*) as count FROM intelligence_insights 
        WHERE title ILIKE '%accuracy%' OR description ILIKE '%accuracy%';
      `;
      console.log(`[DELETE] Accuracy alerts to delete: ${accuracyCountResult[0].count}`);

      if (parseInt(accuracyCountResult[0].count) > 0) {
        // Show examples of what will be deleted
        const exampleResult = await sql`
          SELECT id, title, description 
          FROM intelligence_insights 
          WHERE title ILIKE '%accuracy%' OR description ILIKE '%accuracy%'
          LIMIT 5;
        `;
        
        console.log('\n[DELETE] Examples of alerts to be deleted:');
        exampleResult.forEach((alert, index) => {
          console.log(`${index + 1}. ${alert.title}: ${alert.description?.substring(0, 100)}...`);
        });

        // Delete accuracy alerts
        console.log(`\n[DELETE] Deleting ${accuracyCountResult[0].count} accuracy alerts...`);
        const deleteResult = await sql`
          DELETE FROM intelligence_insights 
          WHERE title ILIKE '%accuracy%' OR description ILIKE '%accuracy%';
        `;
        console.log(`[DELETE] Deleted ${deleteResult.count} accuracy alerts`);

        // Final count
        const finalResult = await sql`
          SELECT COUNT(*) as count FROM intelligence_insights;
        `;
        console.log(`[DELETE] Remaining alerts in database: ${finalResult[0].count}`);

        console.log('\n✅ Successfully cleaned up accuracy alerts from database');
      } else {
        console.log('[DELETE] No accuracy alerts found to delete');
      }
      
    } finally {
      await sql.end();
    }
    
  } catch (error) {
    console.error('❌ Error deleting accuracy alerts:', error);
    process.exit(1);
  }
}

// Run the cleanup
deleteAccuracyAlerts();