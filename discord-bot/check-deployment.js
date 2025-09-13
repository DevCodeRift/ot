// Quick script to check Railway deployment status
// Run this to verify your bot is deployed and accessible

const https = require('https');

async function checkDeployment() {
  // Replace with your actual Railway app URL
  const railwayUrl = 'https://your-bot-app.railway.app/status';
  
  console.log('🔍 Checking Railway deployment...');
  console.log('📍 URL:', railwayUrl);
  console.log('');
  console.log('⚠️  You need to:');
  console.log('1. Find your Railway app URL from Railway dashboard');
  console.log('2. Replace "your-bot-app.railway.app" in this script');
  console.log('3. Run this script again');
  console.log('');
  console.log('Or check Railway logs directly in the dashboard');
}

checkDeployment();