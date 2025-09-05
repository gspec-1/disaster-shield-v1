/**
 * Script to update the APP_URL in the .env file based on the deployment environment
 * 
 * Usage: 
 * - For local development: node scripts/update-env-url.js local
 * - For production: node scripts/update-env-url.js production
 */

const fs = require('fs');
const path = require('path');

// Get the environment from command line arguments
const environment = process.argv[2]?.toLowerCase();

if (!environment || !['local', 'production', 'staging', 'preview'].includes(environment)) {
  console.error('Please specify a valid environment: local, production, staging, or preview');
  process.exit(1);
}

// Define URLs for different environments
const urls = {
  local: 'http://localhost:5173',
  production: 'https://disaster-shield-v2.vercel.app',
  staging: 'https://staging-disaster-shield-v2.vercel.app',
  preview: 'https://preview-disaster-shield-v2.vercel.app'
};

// Path to the .env file
const envPath = path.join(__dirname, '..', '.env');

try {
  // Read the current .env file
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Replace the APP_URL value
  envContent = envContent.replace(
    /VITE_APP_URL=.*/,
    `VITE_APP_URL=${urls[environment]}`
  );
  
  // Write the updated content back to the .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log(`✅ APP_URL updated successfully to: ${urls[environment]}`);
} catch (error) {
  console.error('❌ Error updating APP_URL:', error.message);
  process.exit(1);
}
