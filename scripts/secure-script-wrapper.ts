#!/usr/bin/env ts-node

/**
 * SECURE SCRIPT WRAPPER
 * 
 * Wraps all content-modifying scripts with medical content protection.
 * Must be used for any script that could affect medical advice or educational content.
 * 
 * Usage: ts-node scripts/secure-script-wrapper.ts <script-name> <user-email>
 * Example: ts-node scripts/secure-script-wrapper.ts seed-blog-posts.ts alex@drgolly.com
 */

import MedicalContentProtection from './medical-content-protection';
import * as path from 'path';

async function executeSecureScript() {
  const args = process.argv.slice(2);
  const scriptName = args[0];
  const userEmail = args[1];
  
  if (!scriptName || !userEmail) {
    console.error('Usage: ts-node secure-script-wrapper.ts <script-name> <user-email>');
    console.error('Example: ts-node secure-script-wrapper.ts seed-blog-posts.ts alex@drgolly.com');
    process.exit(1);
  }
  
  const scriptPath = path.join(__dirname, scriptName);
  
  // Validate security
  if (!MedicalContentProtection.validateExecution(scriptPath, userEmail)) {
    console.error('❌ Script execution denied for security reasons');
    process.exit(1);
  }
  
  // Require manual confirmation for medical content changes
  const confirmation = MedicalContentProtection.requireConfirmation(`Execute ${scriptName}`);
  if (!confirmation) {
    console.error('❌ Manual confirmation required');
    console.error('For medical content safety, this script requires explicit approval');
    process.exit(1);
  }
  
  console.log('🚀 Executing script with medical content protection...');
  
  // Execute the actual script
  try {
    const scriptModule = await import(scriptPath);
    
    // Look for common export patterns
    if (scriptModule.default) {
      await scriptModule.default();
    } else if (scriptModule.main) {
      await scriptModule.main();
    } else {
      // Try to find and execute the main function
      const exportKeys = Object.keys(scriptModule);
      const mainFunction = exportKeys.find(key => 
        typeof scriptModule[key] === 'function' && 
        (key.includes('seed') || key.includes('main') || key.includes('run'))
      );
      
      if (mainFunction) {
        await scriptModule[mainFunction]();
      } else {
        console.error('❌ Could not find main function to execute');
        process.exit(1);
      }
    }
    
    console.log('✅ Script executed successfully with medical content protection');
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  }
}

// Only execute if called directly
if (require.main === module) {
  executeSecureScript();
}