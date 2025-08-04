#!/usr/bin/env node

console.log('=== DEPLOYMENT DEBUG SCRIPT ===');
console.log('Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'present' : 'missing');

import net from 'net';
import fs from 'fs';
import { spawn } from 'child_process';
import http from 'http';

async function checkPort(port) {
  return new Promise((resolve) => {
    const testServer = net.createServer();
    testServer.listen(port, '0.0.0.0', () => {
      console.log(`Port ${port}: AVAILABLE`);
      testServer.close(() => resolve(false));
    });
    testServer.on('error', (err) => {
      console.log(`Port ${port}: IN USE (${err.code})`);
      resolve(true);
    });
  });
}

async function main() {
  console.log('\n=== PORT AVAILABILITY CHECK ===');
  await checkPort(5000);
  await checkPort(3001);
  await checkPort(8080);
  
  console.log('\n=== BUILD STATUS ===');
  try {
    const distStats = fs.statSync('./dist/index.js');
    console.log('dist/index.js exists, size:', distStats.size, 'bytes');
    console.log('Last modified:', distStats.mtime);
  } catch (e) {
    console.log('dist/index.js missing:', e.message);
  }
  
  console.log('\n=== ATTEMPTING PRODUCTION START ===');
  console.log('Command: NODE_ENV=production node dist/index.js');
  
  // Start production server with detailed logging
  const prodServer = spawn('node', ['dist/index.js'], {
    env: { ...process.env, NODE_ENV: 'production', PORT: '3001' },
    stdio: 'pipe'
  });
  
  let startupComplete = false;
  
  prodServer.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('[PROD STDOUT]', output.trim());
    if (output.includes('serving on port')) {
      startupComplete = true;
      setTimeout(() => {
        console.log('\n=== TESTING PRODUCTION SERVER ===');
        testProductionServer();
      }, 2000);
    }
  });
  
  prodServer.stderr.on('data', (data) => {
    console.log('[PROD STDERR]', data.toString().trim());
  });
  
  prodServer.on('close', (code) => {
    console.log(`Production server exited with code ${code}`);
  });
  
  // Kill after 10 seconds if not started
  setTimeout(() => {
    if (!startupComplete) {
      console.log('\n=== PRODUCTION SERVER FAILED TO START ===');
      prodServer.kill();
    }
  }, 10000);
}

async function testProductionServer() {
  
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api',
    method: 'GET'
  }, (res) => {
    console.log(`Production API responded with status: ${res.statusCode}`);
    res.on('data', (chunk) => {
      console.log('Response preview:', chunk.toString().substring(0, 100));
    });
    process.exit(0);
  });
  
  req.on('error', (err) => {
    console.log('Production API test failed:', err.message);
    process.exit(1);
  });
  
  req.end();
}

main().catch(console.error);