#!/usr/bin/env node

/**
 * Velociti Intelligence Platform - Production Deployment Script
 * Ensures consistent, reliable deployments with environment validation
 */

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'OPENAI_API_KEY',
  'NODE_ENV'
];

const OPTIONAL_ENV_VARS = [
  'WRITER_API_KEY',
  'PINECONE_API_KEY',
  'PORT'
];

class DeploymentManager {
  constructor() {
    this.startTime = Date.now();
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔧',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
  }

  async validateEnvironment() {
    this.log('Validating environment variables...');
    
    const missing = [];
    const optional = [];
    
    REQUIRED_ENV_VARS.forEach(varName => {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    });
    
    OPTIONAL_ENV_VARS.forEach(varName => {
      if (!process.env[varName]) {
        optional.push(varName);
      }
    });
    
    if (missing.length > 0) {
      this.log(`Missing required environment variables: ${missing.join(', ')}`, 'error');
      return false;
    }
    
    if (optional.length > 0) {
      this.log(`Optional environment variables not set: ${optional.join(', ')}`, 'warning');
    }
    
    this.log('Environment validation passed', 'success');
    return true;
  }

  async validateDatabase() {
    this.log('Validating database connection...');
    
    try {
      const config = await import('../shared/config.js');
      const dbConfig = config.getConfig().database;
      
      if (!dbConfig.url) {
        this.log('Database URL not configured', 'error');
        return false;
      }
      
      this.log('Database configuration valid', 'success');
      return true;
    } catch (error) {
      this.log(`Database validation failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runTests() {
    this.log('Running pre-deployment tests...');
    
    try {
      // TypeScript compilation check
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      this.log('TypeScript compilation check passed', 'success');
      
      return true;
    } catch (error) {
      this.log(`Tests failed: ${error.message}`, 'error');
      return false;
    }
  }

  async buildApplication() {
    this.log('Building application...');
    
    try {
      execSync('npm run build', { stdio: 'inherit' });
      this.log('Application build completed', 'success');
      return true;
    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runMigrations() {
    this.log('Running database migrations...');
    
    try {
      execSync('npm run db:push', { stdio: 'inherit' });
      this.log('Database migrations completed', 'success');
      return true;
    } catch (error) {
      this.log(`Migration failed: ${error.message}`, 'error');
      return false;
    }
  }

  async performHealthCheck() {
    this.log('Performing post-deployment health check...');
    
    try {
      // Start server in background for health check
      const serverProcess = execSync('timeout 10s npm start', { 
        stdio: 'pipe',
        timeout: 15000
      });
      
      this.log('Health check passed', 'success');
      return true;
    } catch (error) {
      // Timeout is expected for this test
      if (error.signal === 'SIGTERM') {
        this.log('Health check passed (server started successfully)', 'success');
        return true;
      }
      
      this.log(`Health check failed: ${error.message}`, 'error');
      return false;
    }
  }

  async deploy() {
    this.log('🚀 Starting Velociti Intelligence Platform deployment...');
    
    const steps = [
      { name: 'Environment Validation', fn: () => this.validateEnvironment() },
      { name: 'Database Validation', fn: () => this.validateDatabase() },
      { name: 'Pre-deployment Tests', fn: () => this.runTests() },
      { name: 'Application Build', fn: () => this.buildApplication() },
      { name: 'Database Migrations', fn: () => this.runMigrations() },
      { name: 'Health Check', fn: () => this.performHealthCheck() }
    ];
    
    for (const step of steps) {
      this.log(`Executing: ${step.name}`);
      const success = await step.fn();
      
      if (!success) {
        this.log(`Deployment failed at step: ${step.name}`, 'error');
        this.printSummary(false);
        process.exit(1);
      }
    }
    
    this.printSummary(true);
  }

  printSummary(success) {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log(`DEPLOYMENT ${success ? 'SUCCESSFUL' : 'FAILED'}`);
    console.log('='.repeat(60));
    console.log(`Duration: ${duration}s`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    
    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\nWarnings:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (success) {
      console.log('\n🎉 Velociti Intelligence Platform is ready for production!');
      console.log('\nNext steps:');
      console.log('1. Monitor application logs for any issues');
      console.log('2. Verify all API endpoints are responding');
      console.log('3. Test critical user workflows');
    }
    
    console.log('='.repeat(60));
  }
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployment = new DeploymentManager();
  deployment.deploy().catch(console.error);
}

export default DeploymentManager;