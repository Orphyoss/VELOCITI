#!/usr/bin/env node

/**
 * Test Current Alert Generation System
 */

async function testCurrentAlertsAPI() {
  try {
    console.log('🧪 Testing Current Alert Generation...');
    
    // First, test the working endpoint that generates alerts
    console.log('\n1. Testing Enhanced Alert Generation...');
    const generateResponse = await fetch('http://localhost:5000/api/agents/generate-scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 3 })
    });
    
    if (generateResponse.ok) {
      const result = await generateResponse.json();
      console.log('✅ Generated alerts:', result.message);
    } else {
      console.log('❌ Failed to generate alerts:', generateResponse.status);
    }
    
    // Wait for processing
    console.log('\nWaiting 3 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test multiple API endpoints to check for freshness
    console.log('\n2. Testing Alert API Endpoints...');
    
    const endpoints = [
      '/api/alerts?limit=3',
      '/api/alerts?limit=3&_fresh=true',
      `/api/alerts?limit=3&timestamp=${Date.now()}`
    ];
    
    for (const endpoint of endpoints) {
      const response = await fetch(`http://localhost:5000${endpoint}`);
      if (response.ok) {
        const alerts = await response.json();
        const latestTimestamp = alerts.length > 0 ? alerts[0].created_at : 'No alerts';
        console.log(`${endpoint}: Latest = ${latestTimestamp}`);
      } else {
        console.log(`${endpoint}: Failed (${response.status})`);
      }
    }
    
    // Check what the Data Generation page would show
    console.log('\n3. Testing Data Generation Job Status...');
    const jobsResponse = await fetch('http://localhost:5000/api/admin/data-generation/jobs');
    if (jobsResponse.ok) {
      const jobs = await jobsResponse.json();
      console.log(`Data generation jobs: ${jobs.length} found`);
      if (jobs.length > 0) {
        console.log('Latest job:', jobs[0].status, jobs[0].date);
      }
    }
    
    console.log('\n✅ Test complete - Check the timestamps above to see if new alerts are appearing');
    
  } catch (error) {
    console.error('❌ Error testing alerts API:', error);
  }
}

await testCurrentAlertsAPI();