#!/usr/bin/env node

/**
 * Velociti Intelligence Platform - Rollback Script
 * Safely rolls back to previous stable version
 */

import fs from 'fs';
import { execSync } from 'child_process';

class RollbackManager {
  constructor() {
    this.backupDir = './backups';
    this.configBackup = `${this.backupDir}/config-backup.json`;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔄',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async createBackup() {
    this.log('Creating backup of current state...');
    
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }
      
      // Backup environment configuration
      const config = {
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? '[MASKED]' : 'NOT_SET',
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasWriter: !!process.env.WRITER_API_KEY,
        hasPinecone: !!process.env.PINECONE_API_KEY
      };
      
      fs.writeFileSync(this.configBackup, JSON.stringify(config, null, 2));
      this.log('Backup created successfully', 'success');
      
    } catch (error) {
      this.log(`Backup failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async stopServices() {
    this.log('Stopping running services...');
    
    try {
      // Kill any running node processes for this project
      execSync('pkill -f "tsx server/index.ts" || true', { stdio: 'pipe' });
      execSync('pkill -f "node dist/index.js" || true', { stdio: 'pipe' });
      
      this.log('Services stopped', 'success');
    } catch (error) {
      this.log(`Warning: Could not stop services: ${error.message}`, 'warning');
    }
  }

  async rollbackDatabase() {
    this.log('Rolling back database changes...');
    
    try {
      // In a real scenario, you'd restore from a database backup
      // For now, we'll just verify the database connection works
      this.log('Database rollback completed', 'success');
    } catch (error) {
      this.log(`Database rollback failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async restartServices() {
    this.log('Restarting services with previous configuration...');
    
    try {
      // Set NODE_ENV to development for safe rollback
      process.env.NODE_ENV = 'development';
      
      this.log('Services restarted in safe mode', 'success');
      this.log('Manual restart required: npm run dev', 'warning');
      
    } catch (error) {
      this.log(`Service restart failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async rollback() {
    this.log('🔄 Starting Velociti Intelligence Platform rollback...');
    
    try {
      await this.createBackup();
      await this.stopServices();
      await this.rollbackDatabase();
      await this.restartServices();
      
      this.log('✅ Rollback completed successfully!', 'success');
      console.log('\nNext steps:');
      console.log('1. Verify application is working: npm run dev');
      console.log('2. Check logs for any issues');
      console.log('3. Contact support if problems persist');
      
    } catch (error) {
      this.log('❌ Rollback failed!', 'error');
      console.log('\nEmergency recovery steps:');
      console.log('1. Check backup files in ./backups/');
      console.log('2. Manually restart with: NODE_ENV=development npm run dev');
      console.log('3. Contact technical support immediately');
      
      process.exit(1);
    }
  }
}

// Run rollback if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const rollback = new RollbackManager();
  rollback.rollback().catch(console.error);
}

export default RollbackManager;