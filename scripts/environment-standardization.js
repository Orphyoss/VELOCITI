#!/usr/bin/env node

/**
 * Environment Standardization Script
 * Ensures consistent behavior across development and production environments
 */

import fs from 'fs';
import path from 'path';

const environmentReplacements = [
  {
    file: 'server/api/metrics.ts',
    replacements: [
      {
        from: /details: process\.env\.NODE_ENV === 'development' \? error\.message : undefined/g,
        to: `details: isDevelopment() ? error.message : undefined`
      }
    ],
    imports: `import { isDevelopment } from '@shared/config';`
  },
  {
    file: 'vite.config.ts',
    replacements: [
      {
        from: /process\.env\.NODE_ENV !== "production" &&\s*process\.env\.REPL_ID !== undefined/g,
        to: `shouldUseCartographer() && process.env.REPL_ID !== undefined`
      }
    ],
    imports: `import { shouldUseCartographer } from './shared/config';`
  }
];

async function standardizeEnvironments() {
  console.log('🔧 Starting environment standardization...');
  
  for (const fileConfig of environmentReplacements) {
    const filePath = fileConfig.file;
    
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        continue;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add imports at the top
      if (fileConfig.imports && !content.includes(fileConfig.imports)) {
        const lines = content.split('\n');
        const lastImportIndex = lines.findLastIndex(line => line.startsWith('import '));
        if (lastImportIndex >= 0) {
          lines.splice(lastImportIndex + 1, 0, fileConfig.imports);
          content = lines.join('\n');
        } else {
          content = fileConfig.imports + '\n' + content;
        }
      }
      
      // Apply replacements
      let modified = false;
      for (const replacement of fileConfig.replacements) {
        if (replacement.from.test(content)) {
          content = content.replace(replacement.from, replacement.to);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated: ${filePath}`);
      } else {
        console.log(`📝 No changes needed: ${filePath}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
  
  console.log('\n🚀 Environment standardization complete!');
  console.log('\nNext steps:');
  console.log('1. Run `npm run build` to test production build');
  console.log('2. Run `npm run start` to test production mode');
  console.log('3. Compare behavior with `npm run dev`');
}

// Run the standardization
standardizeEnvironments().catch(console.error);