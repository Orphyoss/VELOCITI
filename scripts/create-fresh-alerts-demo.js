#!/usr/bin/env node

/**
 * Create Fresh Alerts Demonstration
 */

async function createFreshAlerts() {
  try {
    console.log('🚨 Creating fresh alerts via API...');
    
    // First, generate enhanced scenarios
    const scenarioResponse = await fetch('http://localhost:5000/api/agents/generate-scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 8 })
    });
    
    if (scenarioResponse.ok) {
      const scenarioResult = await scenarioResponse.json();
      console.log('✅ Enhanced scenarios generated:', scenarioResult.message);
      console.log('📊 Scenario stats:', scenarioResult.stats);
    }
    
    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for fresh alerts in the API
    console.log('\n🔍 Checking for fresh alerts...');
    const alertsResponse = await fetch('http://localhost:5000/api/alerts?limit=10');
    
    if (alertsResponse.ok) {
      const alerts = await alertsResponse.json();
      console.log(`📊 API returned ${alerts.length} alerts`);
      
      // Check timestamp freshness
      const now = new Date();
      const freshAlerts = alerts.filter(alert => {
        const alertTime = new Date(alert.created_at);
        const minutesOld = (now.getTime() - alertTime.getTime()) / (1000 * 60);
        return minutesOld < 5; // Less than 5 minutes old
      });
      
      console.log(`🎯 Found ${freshAlerts.length} fresh alerts (< 5 minutes old)`);
      
      if (freshAlerts.length > 0) {
        console.log('\n🚨 Fresh alerts:');
        freshAlerts.slice(0, 3).forEach((alert, index) => {
          const alertTime = new Date(alert.created_at);
          const minutesOld = Math.round((now.getTime() - alertTime.getTime()) / (1000 * 60));
          console.log(`${index + 1}. ${alert.title} (${minutesOld}m ago) - ${alert.priority.toUpperCase()}`);
        });
      } else {
        console.log('⚠️  No fresh alerts found - checking latest 3:');
        alerts.slice(0, 3).forEach((alert, index) => {
          const alertTime = new Date(alert.created_at);
          console.log(`${index + 1}. ${alert.title} - ${alertTime.toLocaleTimeString()}`);
        });
      }
    } else {
      console.log('❌ Failed to fetch alerts:', alertsResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Error creating fresh alerts:', error);
  }
}

await createFreshAlerts();