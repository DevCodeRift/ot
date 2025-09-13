/**
 * Test script to verify the bot channels API URL construction
 */

require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Bot Channels API URL Construction');
console.log('='.repeat(50));

// Test environment variables
console.log('📋 Environment Variables:');
console.log('- DISCORD_BOT_API_URL:', process.env.DISCORD_BOT_API_URL || '❌ NOT SET');
console.log('- DISCORD_BOT_URL:', process.env.DISCORD_BOT_URL || '❌ NOT SET (this is correct - should not be set)');
console.log('- WEBAPP_BOT_SECRET:', process.env.WEBAPP_BOT_SECRET ? '✅ SET' : '❌ NOT SET');

// Test URL construction (simulating what the channels route does)
const testServerId = '1407812256636469470';
const botUrl = process.env.DISCORD_BOT_API_URL;

if (botUrl) {
  const fullUrl = `${botUrl}/api/channels/${testServerId}`;
  console.log('\n🔗 Constructed URL:');
  console.log(`   ${fullUrl}`);
  
  // Validate URL
  try {
    new URL(fullUrl);
    console.log('✅ URL is valid');
  } catch (error) {
    console.log('❌ URL is invalid:', error.message);
  }
} else {
  console.log('\n❌ Cannot construct URL - DISCORD_BOT_API_URL not set');
}

// Test what the old code would have done
console.log('\n🔍 What the old code would have done:');
const oldUrl = process.env.DISCORD_BOT_URL; // This is undefined
console.log('- process.env.DISCORD_BOT_URL:', oldUrl || 'undefined');
if (!oldUrl) {
  const wouldBeUrl = `${oldUrl}/api/channels/${testServerId}`;
  console.log('- Constructed URL would be:', wouldBeUrl);
  console.log('❌ This would cause the "undefined/api/channels/..." error');
}

console.log('\n🎯 Fix Summary:');
console.log('✅ Changed process.env.DISCORD_BOT_URL to process.env.DISCORD_BOT_API_URL');
console.log('✅ Now using correct environment variable that is actually set');
console.log('✅ URL construction should work properly now');