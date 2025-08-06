#!/usr/bin/env node
/**
 * Delete accuracy-related alerts from intelligence_insights table
 * Using Supabase database connection
 */

import { client } from '../server/services/supabase.ts';

async function deleteAccuracyAlerts() {
  try {
    console.log('[DELETE] Connecting to Supabase database...');

    // First, count total alerts
    const { count: totalCount, error: countError } = await client
      .from('intelligence_insights')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Error counting total alerts: ${countError.message}`);
    }

    console.log(`[DELETE] Total alerts in database: ${totalCount}`);

    // Count and get accuracy alerts
    const { data: accuracyAlerts, count: accuracyCount, error: accuracyError } = await client
      .from('intelligence_insights')
      .select('id, title, description', { count: 'exact' })
      .or('title.ilike.%accuracy%, description.ilike.%accuracy%');

    if (accuracyError) {
      throw new Error(`Error fetching accuracy alerts: ${accuracyError.message}`);
    }

    console.log(`[DELETE] Accuracy alerts to delete: ${accuracyCount}`);
    
    if (accuracyCount > 0) {
      console.log('\n[DELETE] Examples of alerts to be deleted:');
      accuracyAlerts.slice(0, 5).forEach((alert, index) => {
        console.log(`${index + 1}. ${alert.title}: ${alert.description?.substring(0, 100)}...`);
      });

      // Delete accuracy alerts
      console.log(`\n[DELETE] Deleting ${accuracyCount} accuracy alerts...`);
      const { error: deleteError } = await client
        .from('intelligence_insights')
        .delete()
        .or('title.ilike.%accuracy%, description.ilike.%accuracy%');

      if (deleteError) {
        throw new Error(`Error deleting accuracy alerts: ${deleteError.message}`);
      }

      console.log(`[DELETE] Successfully deleted ${accuracyCount} accuracy alerts`);
    } else {
      console.log('[DELETE] No accuracy alerts found to delete');
    }

    // Final count
    const { count: finalCount, error: finalError } = await client
      .from('intelligence_insights')
      .select('*', { count: 'exact', head: true });

    if (finalError) {
      throw new Error(`Error getting final count: ${finalError.message}`);
    }

    console.log(`[DELETE] Remaining alerts in database: ${finalCount}`);
    console.log('\n✅ Successfully cleaned up accuracy alerts from database');

  } catch (error) {
    console.error('❌ Error deleting accuracy alerts:', error);
    process.exit(1);
  }
}

// Run the cleanup
deleteAccuracyAlerts();