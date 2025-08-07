#!/usr/bin/env node

/**
 * Stop production server script
 */

import fs from 'fs';
import { execSync } from 'child_process';

try {
  console.log('🛑 Stopping production server...');
  
  // Kill by PID file
  if (fs.existsSync('.production-pid')) {
    const pid = fs.readFileSync('.production-pid', 'utf8');
    execSync(`kill ${pid}`, { stdio: 'pipe' });
    fs.unlinkSync('.production-pid');
    console.log('✅ Production server stopped (PID: ' + pid + ')');
  } else {
    // Kill by process name
    execSync('pkill -f "node dist/index.js" || true', { stdio: 'pipe' });
    console.log('✅ Production processes cleaned up');
  }
  
} catch (error) {
  console.log('⚠️ No production server running');
}