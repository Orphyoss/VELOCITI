#!/usr/bin/env node

/**
 * PRODUCTION ENVIRONMENT COMPREHENSIVE DEBUG
 * Tests actual production deployment from user perspective
 */

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

async function productionEnvironmentDebug() {
  console.log('🔍 PRODUCTION ENVIRONMENT DEBUG');
  console.log('='.repeat(60));
  console.log(`Testing user-facing application at: https://velociti.replit.app`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const results = {
    webpageLoads: false,
    reactHydrated: false,
    alertsVisible: false,
    apiCallsWork: false,
    buildArtifacts: false,
    errors: []
  };

  try {
    // 1. Test actual webpage loading
    console.log('📄 WEBPAGE LOADING TEST');
    console.log('-'.repeat(40));
    
    const htmlResponse = await fetch('https://velociti.replit.app/');
    const htmlContent = await htmlResponse.text();
    
    console.log(`Status: ${htmlResponse.status}`);
    console.log(`Content length: ${htmlContent.length} characters`);
    
    if (htmlResponse.status === 200 && htmlContent.length > 1000) {
      results.webpageLoads = true;
      console.log('✅ Webpage loads successfully');
    } else {
      results.webpageLoads = false;
      console.log('❌ Webpage failed to load properly');
      results.errors.push(`Webpage status: ${htmlResponse.status}, length: ${htmlContent.length}`);
    }

    // 2. Check for React hydration and app structure
    console.log('\n⚛️ REACT APPLICATION TEST');
    console.log('-'.repeat(40));
    
    const hasReactRoot = htmlContent.includes('id="root"') || htmlContent.includes('react');
    const hasViteAssets = htmlContent.includes('/assets/') || htmlContent.includes('type="module"');
    const hasAlertComponents = htmlContent.includes('alert') || htmlContent.includes('competitive') || htmlContent.includes('intelligence');
    
    console.log(`React root element: ${hasReactRoot ? '✅' : '❌'}`);
    console.log(`Vite build assets: ${hasViteAssets ? '✅' : '❌'}`);
    console.log(`Alert-related content: ${hasAlertComponents ? '✅' : '❌'}`);
    
    if (hasReactRoot && hasViteAssets) {
      results.reactHydrated = true;
      console.log('✅ React application structure present');
    } else {
      results.reactHydrated = false;
      console.log('❌ React application not properly hydrated');
      results.errors.push('Missing React root or Vite assets');
    }

    // 3. Test API endpoints from production domain
    console.log('\n🌐 API CONNECTIVITY TEST');
    console.log('-'.repeat(40));
    
    const apiEndpoints = [
      { path: '/api/alerts', name: 'Alerts API' },
      { path: '/api/agents', name: 'Agents API' },
      { path: '/api/metrics/alerts', name: 'Metrics API' }
    ];

    let apiWorking = 0;
    for (const endpoint of apiEndpoints) {
      try {
        const apiResponse = await fetch(`https://velociti.replit.app${endpoint.path}`);
        const apiData = await apiResponse.json();
        
        const itemCount = Array.isArray(apiData) ? apiData.length : 'object';
        console.log(`${endpoint.name}: ${apiResponse.status} | ${itemCount} items`);
        
        if (apiResponse.status === 200) {
          apiWorking++;
        }
      } catch (error) {
        console.log(`${endpoint.name}: ERROR - ${error.message}`);
        results.errors.push(`${endpoint.name} failed: ${error.message}`);
      }
    }

    results.apiCallsWork = apiWorking === apiEndpoints.length;
    console.log(`API endpoints working: ${apiWorking}/${apiEndpoints.length} ${results.apiCallsWork ? '✅' : '❌'}`);

    // 4. Check for build artifacts and static assets
    console.log('\n📦 BUILD ARTIFACTS TEST');
    console.log('-'.repeat(40));
    
    // Test for common Vite build patterns
    const jsAssetMatch = htmlContent.match(/\/assets\/index-[a-zA-Z0-9]+\.js/);
    const cssAssetMatch = htmlContent.match(/\/assets\/index-[a-zA-Z0-9]+\.css/);
    
    console.log(`JavaScript bundle: ${jsAssetMatch ? '✅ ' + jsAssetMatch[0] : '❌ Not found'}`);
    console.log(`CSS bundle: ${cssAssetMatch ? '✅ ' + cssAssetMatch[0] : '❌ Not found'}`);
    
    if (jsAssetMatch && cssAssetMatch) {
      results.buildArtifacts = true;
      console.log('✅ Build artifacts present');
      
      // Test if assets are accessible
      try {
        const jsResponse = await fetch(`https://velociti.replit.app${jsAssetMatch[0]}`);
        const cssResponse = await fetch(`https://velociti.replit.app${cssAssetMatch[0]}`);
        
        console.log(`JavaScript asset loads: ${jsResponse.status === 200 ? '✅' : '❌'}`);
        console.log(`CSS asset loads: ${cssResponse.status === 200 ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`❌ Asset loading failed: ${error.message}`);
        results.errors.push(`Asset loading failed: ${error.message}`);
      }
    } else {
      results.buildArtifacts = false;
      console.log('❌ Build artifacts missing or malformed');
      results.errors.push('Build artifacts not found in HTML');
    }

    // 5. Simulated browser test using JSDOM
    console.log('\n🖥️ SIMULATED BROWSER TEST');
    console.log('-'.repeat(40));
    
    try {
      const dom = new JSDOM(htmlContent, {
        url: 'https://velociti.replit.app/',
        runScripts: 'dangerously',
        resources: 'usable'
      });
      
      const document = dom.window.document;
      const rootElement = document.getElementById('root');
      
      console.log(`Root element exists: ${rootElement ? '✅' : '❌'}`);
      console.log(`Root has content: ${rootElement && rootElement.children.length > 0 ? '✅' : '❌'}`);
      
      // Check for alert-related elements
      const alertElements = document.querySelectorAll('[class*="alert"], [class*="competitive"], [data-testid*="alert"]');
      console.log(`Alert UI elements found: ${alertElements.length > 0 ? '✅ ' + alertElements.length + ' elements' : '❌ None found'}`);
      
      results.alertsVisible = alertElements.length > 0;
      
      dom.window.close();
    } catch (error) {
      console.log(`❌ Browser simulation failed: ${error.message}`);
      results.errors.push(`JSDOM simulation failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Production debug failed:', error);
    results.errors.push(`Debug script error: ${error.message}`);
  }

  // 6. FINAL DIAGNOSIS
  console.log('\n🎯 FINAL DIAGNOSIS');
  console.log('='.repeat(60));
  
  const passedTests = Object.values(results).filter(v => v === true).length - 1; // -1 for errors array
  const totalTests = Object.keys(results).length - 1; // -1 for errors array
  
  console.log(`Tests passed: ${passedTests}/${totalTests}`);
  console.log(`Webpage loads: ${results.webpageLoads ? '✅' : '❌'}`);
  console.log(`React hydrated: ${results.reactHydrated ? '✅' : '❌'}`);
  console.log(`API calls work: ${results.apiCallsWork ? '✅' : '❌'}`);
  console.log(`Build artifacts: ${results.buildArtifacts ? '✅' : '❌'}`);
  console.log(`Alerts visible: ${results.alertsVisible ? '✅' : '❌'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    results.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }
  
  // Final verdict
  if (passedTests === totalTests && results.errors.length === 0) {
    console.log('\n🎉 PRODUCTION DEPLOYMENT IS WORKING');
  } else {
    console.log('\n🚨 PRODUCTION DEPLOYMENT HAS ISSUES');
    console.log('Focus areas for fixing:');
    if (!results.webpageLoads) console.log('  - Webpage loading issues');
    if (!results.reactHydrated) console.log('  - React application not hydrating');
    if (!results.apiCallsWork) console.log('  - API connectivity problems');
    if (!results.buildArtifacts) console.log('  - Build/deployment configuration');
    if (!results.alertsVisible) console.log('  - UI components not rendering data');
  }
  
  return results;
}

// Install required dependency if missing
try {
  await import('jsdom');
} catch (error) {
  console.log('Installing jsdom dependency...');
  const { execSync } = await import('child_process');
  execSync('npm install jsdom', { stdio: 'inherit' });
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  productionEnvironmentDebug().catch(console.error);
}

export default productionEnvironmentDebug;