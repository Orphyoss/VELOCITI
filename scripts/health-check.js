#!/usr/bin/env node

/**
 * Velociti Intelligence Platform - Health Check Script
 * Monitors system health and validates all components
 */

import fetch from 'node-fetch';

class HealthChecker {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    this.checks = [];
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔍',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkEndpoint(name, endpoint, expectedStatus = 200) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Velociti-HealthCheck/1.0'
        }
      });
      
      if (response.status === expectedStatus) {
        this.log(`${name}: OK (${response.status})`, 'success');
        this.results.passed++;
        return true;
      } else {
        this.log(`${name}: Failed (${response.status})`, 'error');
        this.results.failed++;
        return false;
      }
    } catch (error) {
      this.log(`${name}: Error - ${error.message}`, 'error');
      this.results.failed++;
      return false;
    }
  }

  async checkDatabase() {
    this.log('Checking database connectivity...');
    
    try {
      const config = await import('../shared/config.js');
      const dbConfig = config.getConfig().database;
      
      if (dbConfig.url) {
        this.log('Database: Configuration valid', 'success');
        this.results.passed++;
        return true;
      } else {
        this.log('Database: No URL configured', 'error');
        this.results.failed++;
        return false;
      }
    } catch (error) {
      this.log(`Database: ${error.message}`, 'error');
      this.results.failed++;
      return false;
    }
  }

  async checkAPIKeys() {
    this.log('Checking API key configuration...');
    
    const keys = [
      { name: 'OpenAI', env: 'OPENAI_API_KEY', required: true },
      { name: 'Writer AI', env: 'WRITER_API_KEY', required: false },
      { name: 'Pinecone', env: 'PINECONE_API_KEY', required: false }
    ];
    
    keys.forEach(key => {
      if (process.env[key.env]) {
        this.log(`${key.name} API Key: Configured`, 'success');
        this.results.passed++;
      } else if (key.required) {
        this.log(`${key.name} API Key: Missing (Required)`, 'error');
        this.results.failed++;
      } else {
        this.log(`${key.name} API Key: Missing (Optional)`, 'warning');
        this.results.warnings++;
      }
    });
  }

  async runHealthChecks() {
    this.log('🔍 Starting Velociti Intelligence Platform health checks...');
    
    // Configuration checks
    await this.checkDatabase();
    await this.checkAPIKeys();
    
    // API endpoint checks
    const endpoints = [
      { name: 'Root API', path: '/api' },
      { name: 'Alerts API', path: '/api/alerts?limit=1' },
      { name: 'Agents API', path: '/api/agents' },
      { name: 'System Metrics', path: '/api/metrics/system-performance' },
      { name: 'AI Accuracy', path: '/api/metrics/ai-accuracy' },
      { name: 'RM Metrics', path: '/api/rm-metrics' }
    ];
    
    for (const endpoint of endpoints) {
      await this.checkEndpoint(endpoint.name, endpoint.path);
    }
    
    this.printSummary();
  }

  printSummary() {
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const healthScore = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('HEALTH CHECK SUMMARY');
    console.log('='.repeat(60));
    console.log(`Overall Health Score: ${healthScore}%`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All critical systems are healthy!');
    } else if (this.results.failed <= 2) {
      console.log('\n⚠️  Minor issues detected. Review and fix when possible.');
    } else {
      console.log('\n🚨 Critical issues detected. Immediate attention required!');
    }
    
    console.log('='.repeat(60));
    
    // Exit with error code if critical failures
    if (this.results.failed > 2) {
      process.exit(1);
    }
  }
}

// Run health check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new HealthChecker();
  checker.runHealthChecks().catch(console.error);
}

export default HealthChecker;