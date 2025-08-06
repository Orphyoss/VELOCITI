#!/usr/bin/env node
/**
 * Delete accuracy-related alerts using API calls
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function cleanupAccuracyAlerts() {
  try {
    console.log('[CLEANUP] Fetching all alerts from API...');
    
    // Get all alerts
    const response = await fetch(`${API_BASE}/alerts?limit=2000`);
    if (!response.ok) {
      throw new Error(`Failed to fetch alerts: ${response.statusText}`);
    }
    
    const allAlerts = await response.json();
    console.log(`[CLEANUP] Total alerts fetched: ${allAlerts.length}`);
    
    // Find accuracy alerts
    const accuracyAlerts = allAlerts.filter(alert => 
      (alert.title && alert.title.toLowerCase().includes('accuracy')) ||
      (alert.description && alert.description.toLowerCase().includes('accuracy'))
    );
    
    console.log(`[CLEANUP] Found ${accuracyAlerts.length} accuracy-related alerts to delete`);
    
    if (accuracyAlerts.length > 0) {
      console.log('\n[CLEANUP] Examples of accuracy alerts:');
      accuracyAlerts.slice(0, 5).forEach((alert, index) => {
        console.log(`${index + 1}. ID: ${alert.id} | Title: ${alert.title}`);
        console.log(`   Description: ${alert.description?.substring(0, 100)}...`);
      });
      
      // Since there's no DELETE API endpoint visible, let's try to use the Supabase client directly
      // by importing the database utilities from the server
      console.log('\n[CLEANUP] Connecting directly to database...');
      
      // Import the Supabase client using dynamic import and tsx
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      // Create a temporary SQL script
      const ids = accuracyAlerts.map(alert => `'${alert.id}'`).join(',');
      console.log(`[CLEANUP] Attempting to delete ${accuracyAlerts.length} alerts with IDs: ${ids.substring(0, 100)}...`);
      
      // Use the server's database connection via a direct query
      const deleteScript = `
        import { client } from '../server/services/supabase.ts';
        
        async function deleteAlerts() {
          const ids = [${accuracyAlerts.map(a => `'${a.id}'`).join(',')}];
          const { error } = await client
            .from('intelligence_insights')
            .delete()
            .in('id', ids);
          
          if (error) {
            console.error('Delete error:', error);
            process.exit(1);
          }
          console.log('Successfully deleted', ids.length, 'alerts');
        }
        
        deleteAlerts().catch(console.error);
      `;
      
      // Write and execute the delete script
      const fs = await import('fs');
      await fs.promises.writeFile('/tmp/delete-script.mjs', deleteScript);
      
      try {
        await execAsync('cd /home/runner/workspace && npx tsx /tmp/delete-script.mjs');
        console.log(`✅ Successfully deleted ${accuracyAlerts.length} accuracy alerts from database`);
      } catch (execError) {
        console.error('❌ Error executing delete script:', execError.message);
        throw execError;
      }
      
    } else {
      console.log('[CLEANUP] No accuracy alerts found to delete');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupAccuracyAlerts();