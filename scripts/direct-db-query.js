#!/usr/bin/env node

// Direct database query to test load factor values
const { neon } = await import('@neondatabase/serverless');

const sql = neon(process.env.DEV_DATABASE_URL);

try {
  const query = process.argv[2];
  if (!query) {
    console.log('Usage: node direct-db-query.js "SELECT * FROM table_name LIMIT 5"');
    process.exit(1);
  }
  
  console.log(`Executing: ${query}`);
  const result = await sql(query);
  console.log('Results:');
  console.table(result);
} catch (error) {
  console.error('Database query error:', error.message);
}