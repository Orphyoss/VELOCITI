#!/usr/bin/env node

/**
 * TEST DATA GENERATION
 * Test the data generation functionality directly
 */

import { dataGenerator } from './server/services/dataGenerator.js';

console.log('🧪 Testing Data Generation System');
console.log('================================');

try {
  console.log('Attempting to generate data for 2025-08-05...');
  
  const result = await dataGenerator.generateData({
    date: '2025-08-05',
    scenario: 'competitive_attack'
  });
  
  console.log('✅ Data generation completed!');
  console.log('Results:', result);
  
  const totalRecords = Object.values(result).reduce((sum, count) => sum + count, 0);
  console.log(`📊 Total records generated: ${totalRecords}`);
  
} catch (error) {
  console.error('❌ Data generation failed:', error.message);
  console.error('Stack:', error.stack);
}