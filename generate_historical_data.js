#!/usr/bin/env node
/**
 * Historical Data Generation Script
 * Populates missing dates with realistic airline intelligence data
 */

import axios from 'axios';

const API_BASE = 'http://localhost:5000';

// Define scenarios for each date (realistic progression)
const dataSchedule = [
  { date: '2025-08-01', scenario: 'normal_operations' },
  { date: '2025-07-30', scenario: 'competitive_attack' },
  { date: '2025-07-29', scenario: 'demand_surge' },
  { date: '2025-07-28', scenario: 'normal_operations' },
  { date: '2025-07-27', scenario: 'operational_disruption' },
  { date: '2025-07-26', scenario: 'normal_operations' },
  { date: '2025-07-25', scenario: 'economic_shock' }
];

async function generateDataForDate(dateEntry) {
  try {
    console.log(`Generating data for ${dateEntry.date} with scenario: ${dateEntry.scenario}`);
    
    const response = await axios.post(`${API_BASE}/api/admin/data-generation/generate`, {
      date: dateEntry.date,
      scenario: dateEntry.scenario
    });
    
    console.log(`✓ Started job ${response.data.jobId} for ${dateEntry.date}`);
    return response.data;
    
  } catch (error) {
    console.error(`✗ Failed to generate data for ${dateEntry.date}:`, error.message);
    return null;
  }
}

async function checkJobStatus() {
  try {
    const response = await axios.get(`${API_BASE}/api/admin/data-generation/jobs`);
    return response.data;
  } catch (error) {
    console.error('Failed to check job status:', error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting historical data generation...\n');
  
  // Generate data for all missing dates
  const jobs = [];
  for (const dateEntry of dataSchedule) {
    const job = await generateDataForDate(dateEntry);
    if (job) {
      jobs.push(job);
    }
    
    // Wait a moment between requests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Generated ${jobs.length} data generation jobs`);
  
  // Wait for jobs to complete
  console.log('\n⏳ Waiting for jobs to complete...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Check final status
  const finalJobs = await checkJobStatus();
  console.log('\n✅ Data generation complete! Current jobs:');
  
  finalJobs.forEach(job => {
    const totalRecords = job.recordCounts ? 
      Object.values(job.recordCounts).reduce((sum, count) => sum + count, 0) : 0;
    console.log(`  ${job.date}: ${job.status} (${totalRecords} records)`);
  });
}

// Run the script
main().catch(console.error);