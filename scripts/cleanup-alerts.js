#!/usr/bin/env node
/**
 * Cleanup accuracy alerts using the application's storage layer
 */

import { createStorage } from '../server/storage.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function cleanupAccuracyAlerts() {
  try {
    console.log('[CLEANUP] Initializing storage...');
    const storage = createStorage();
    
    console.log('[CLEANUP] Fetching all alerts...');
    const allAlerts = await storage.getAlerts(2000); // Get a large number to see all
    
    console.log(`[CLEANUP] Total alerts in database: ${allAlerts.length}`);
    
    // Find accuracy alerts
    const accuracyAlerts = allAlerts.filter(alert => 
      alert.title?.toLowerCase().includes('accuracy') || 
      alert.description?.toLowerCase().includes('accuracy')
    );
    
    console.log(`[CLEANUP] Found ${accuracyAlerts.length} accuracy-related alerts`);
    
    if (accuracyAlerts.length > 0) {
      console.log('\n[CLEANUP] Examples of accuracy alerts to be deleted:');
      accuracyAlerts.slice(0, 5).forEach((alert, index) => {
        console.log(`${index + 1}. ${alert.title}: ${alert.description?.substring(0, 100)}...`);
      });
      
      // Delete each accuracy alert
      console.log(`\n[CLEANUP] Deleting ${accuracyAlerts.length} accuracy alerts...`);
      
      for (const alert of accuracyAlerts) {
        await storage.deleteAlert(alert.id);
      }
      
      console.log('✅ Successfully deleted all accuracy alerts');
    } else {
      console.log('ℹ️  No accuracy alerts found to delete');
    }
    
    // Get final count
    const remainingAlerts = await storage.getAlerts(2000);
    console.log(`[CLEANUP] Remaining alerts in database: ${remainingAlerts.length}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupAccuracyAlerts();