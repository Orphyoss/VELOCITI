#!/usr/bin/env node

/**
 * Production Database Troubleshooting & Fix Script
 * Systematically diagnoses and resolves the production "No Alerts" issue
 */

const fetch = require('node-fetch');

class ProductionTroubleshooter {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  log(step, status, data = null) {
    const result = {
      step,
      status,
      timestamp: new Date().toISOString(),
      data
    };
    this.results.push(result);
    console.log(`[${status}] ${step}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`);
  }

  async step1_testEnvironment() {
    console.log('\n=== STEP 1: Environment Verification ===');
    
    try {
      const response = await fetch(`${this.baseUrl}/debug-env`);
      const data = await response.json();
      
      if (data.DATABASE_URL && data.OPENAI_API_KEY) {
        this.log('Environment Check', 'PASS', 'All required env vars present');
        return true;
      } else {
        this.log('Environment Check', 'FAIL', 'Missing environment variables');
        return false;
      }
    } catch (error) {
      this.log('Environment Check', 'ERROR', error.message);
      return false;
    }
  }

  async step2_testDatabase() {
    console.log('\n=== STEP 2: Database Connection Test ===');
    
    try {
      const response = await fetch(`${this.baseUrl}/debug-db`);
      const data = await response.json();
      
      if (data.connectionTest === 'SUCCESS') {
        this.log('Database Connection', 'PASS', `Alerts: ${data.alerts.count}, Agents: ${data.agents.count}`);
        return {
          connected: true,
          alertCount: data.alerts.count,
          agentCount: data.agents.count,
          sample: data.alerts.sample
        };
      } else {
        this.log('Database Connection', 'FAIL', data);
        return { connected: false };
      }
    } catch (error) {
      this.log('Database Connection', 'ERROR', error.message);
      return { connected: false };
    }
  }

  async step3_populateDatabase() {
    console.log('\n=== STEP 3: Database Population ===');
    
    try {
      const response = await fetch(`${this.baseUrl}/debug-populate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.log('Database Population', 'SUCCESS', data);
        return true;
      } else {
        this.log('Database Population', 'FAIL', data);
        return false;
      }
    } catch (error) {
      this.log('Database Population', 'ERROR', error.message);
      return false;
    }
  }

  async step4_verifyFix() {
    console.log('\n=== STEP 4: Fix Verification ===');
    
    try {
      // Wait a moment for database changes to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch(`${this.baseUrl}/debug-db`);
      const data = await response.json();
      
      if (data.alerts.count > 0) {
        this.log('Fix Verification', 'SUCCESS', `Database now has ${data.alerts.count} alerts`);
        return true;
      } else {
        this.log('Fix Verification', 'FAIL', 'Database still empty after population');
        return false;
      }
    } catch (error) {
      this.log('Fix Verification', 'ERROR', error.message);
      return false;
    }
  }

  async step5_testAnalystWorkbench() {
    console.log('\n=== STEP 5: Analyst Workbench Test ===');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/metrics/alerts`);
      const data = await response.json();
      
      if (data.success && data.data.activeAlerts > 0) {
        this.log('Analyst Workbench API', 'SUCCESS', `${data.data.activeAlerts} alerts available`);
        return true;
      } else {
        this.log('Analyst Workbench API', 'FAIL', 'No alerts returned by API');
        return false;
      }
    } catch (error) {
      this.log('Analyst Workbench API', 'ERROR', error.message);
      return false;
    }
  }

  async runFullDiagnosis() {
    console.log('🔍 Starting Production Database Diagnosis...\n');
    
    const envOk = await this.step1_testEnvironment();
    if (!envOk) {
      console.log('\n❌ DIAGNOSIS FAILED: Environment variables missing');
      return this.generateReport(false);
    }

    const dbResult = await this.step2_testDatabase();
    if (!dbResult.connected) {
      console.log('\n❌ DIAGNOSIS FAILED: Database connection failed');
      return this.generateReport(false);
    }

    if (dbResult.alertCount === 0) {
      console.log('\n🔧 DIAGNOSIS CONFIRMED: Production database is empty');
      console.log('Proceeding with emergency population...');
      
      const populated = await this.step3_populateDatabase();
      if (!populated) {
        console.log('\n❌ FIX FAILED: Could not populate database');
        return this.generateReport(false);
      }
      
      const verified = await this.step4_verifyFix();
      if (!verified) {
        console.log('\n❌ FIX FAILED: Population did not work');
        return this.generateReport(false);
      }
    } else {
      console.log('\n✅ DATABASE OK: Already has alerts, checking API...');
    }

    const apiOk = await this.step5_testAnalystWorkbench();
    if (!apiOk) {
      console.log('\n❌ API ISSUE: Alerts exist but API not working');
      return this.generateReport(false);
    }

    console.log('\n✅ DIAGNOSIS COMPLETE: All systems operational');
    return this.generateReport(true);
  }

  generateReport(success) {
    const report = {
      success,
      timestamp: new Date().toISOString(),
      steps: this.results,
      summary: success ? 'Production database issue resolved' : 'Production database issue persists'
    };

    console.log('\n📋 TROUBLESHOOTING REPORT:');
    console.log('='.repeat(50));
    console.log(JSON.stringify(report, null, 2));
    
    return report;
  }
}

// Usage
async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || 'https://your-production-url.replit.dev';
  
  if (baseUrl === 'https://your-production-url.replit.dev') {
    console.log('❗ Please provide your production URL:');
    console.log(`node troubleshoot-production.js https://your-actual-production.replit.dev`);
    process.exit(1);
  }

  const troubleshooter = new ProductionTroubleshooter(baseUrl);
  const report = await troubleshooter.runFullDiagnosis();
  
  process.exit(report.success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ProductionTroubleshooter;