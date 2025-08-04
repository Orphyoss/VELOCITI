#!/usr/bin/env node

/**
 * Velociti Intelligence Platform - FIXED Production Deployment Script
 * Properly handles port conflicts and environment switching
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { spawn } from 'child_process';

class ProductionDeployment {
  constructor() {
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const prefix = {
      info: '🔧',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    console.log(`${prefix} ${message}`);
  }

  async validateEnvironment() {
    this.log('Validating production environment...');
    
    const required = ['DATABASE_URL', 'OPENAI_API_KEY'];
    const missing = required.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
      this.log(`Missing required environment variables: ${missing.join(', ')}`, 'error');
      return false;
    }
    
    this.log('Environment validation passed', 'success');
    return true;
  }

  async buildApplication() {
    this.log('Building production application...');
    
    try {
      execSync('npm run build', { stdio: 'inherit' });
      this.log('Production build completed successfully', 'success');
      return true;
    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
      return false;
    }
  }

  async startProductionServer() {
    this.log('Starting production server on port 3001...');
    
    const server = spawn('node', ['dist/index.js'], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '3001'
      },
      stdio: 'pipe',
      detached: false
    });

    server.stdout.on('data', (data) => {
      console.log(`[PROD] ${data.toString().trim()}`);
    });

    server.stderr.on('data', (data) => {
      console.error(`[PROD ERROR] ${data.toString().trim()}`);
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    this.log('Production server started on port 3001', 'success');
    this.log('Access your production app at: http://localhost:3001', 'success');
    
    return server;
  }

  async runHealthCheck() {
    this.log('Running production health check...');
    
    try {
      const response = await fetch('http://localhost:3001/api', {
        timeout: 5000
      });
      
      if (response.ok) {
        this.log('Production health check passed', 'success');
        return true;
      } else {
        this.log(`Health check failed: ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Health check failed: ${error.message}`, 'error');
      return false;
    }
  }

  async deploy() {
    this.log('=== VELOCITI PRODUCTION DEPLOYMENT ===');
    
    // Validate environment
    if (!(await this.validateEnvironment())) {
      process.exit(1);
    }

    // Build application
    if (!(await this.buildApplication())) {
      process.exit(1);
    }

    // Start production server
    const server = await this.startProductionServer();

    // Run health check
    if (!(await this.runHealthCheck())) {
      this.log('Stopping failed deployment...', 'warning');
      server.kill();
      process.exit(1);
    }

    this.log('=== DEPLOYMENT SUCCESSFUL ===', 'success');
    this.log('Production server running with development server (port 5000)', 'success');
    this.log('Production server: http://localhost:3001', 'success');
    this.log('Development server: http://localhost:5000', 'success');
    
    // Keep process alive
    process.on('SIGINT', () => {
      this.log('Shutting down production server...', 'warning');
      server.kill();
      process.exit(0);
    });
  }
}

// Run deployment
const deployment = new ProductionDeployment();
deployment.deploy().catch(console.error);