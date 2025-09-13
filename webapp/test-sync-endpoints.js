const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSyncEndpoints() {
  try {
    console.log('🔍 Testing Sync Endpoints...\n');
    
    // Test 1: Test webapp Discord sync endpoint
    console.log('🧪 Test 1: Testing webapp Discord sync endpoint');
    
    try {
      const webappSyncResponse = await fetch('http://localhost:3000/api/bot/discord-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WEBAPP_BOT_SECRET}`
        },
        body: JSON.stringify({
          action: 'assign',
          discordUserId: '123456789',
          discordRoleId: '987654321',
          allianceId: 790
        })
      });
      
      if (webappSyncResponse.ok) {
        const webappSyncResult = await webappSyncResponse.json();
        console.log('✅ Webapp Discord sync endpoint working');
        console.log('📊 Result:', JSON.stringify(webappSyncResult, null, 2));
      } else {
        const webappSyncError = await webappSyncResponse.json();
        console.log('❌ Webapp Discord sync failed:', webappSyncResponse.status);
        console.log('📋 Error details:', JSON.stringify(webappSyncError, null, 2));
      }
    } catch (webappSyncError) {
      console.log('❌ Webapp Discord sync failed with exception:', webappSyncError.message);
    }
    
    console.log('');
    
    // Test 2: Test Discord bot sync endpoint
    console.log('🧪 Test 2: Testing Discord bot sync endpoint');
    
    try {
      const DISCORD_BOT_URL = process.env.DISCORD_BOT_API_URL || 'https://ot-production.up.railway.app';
      const WEBAPP_BOT_SECRET = process.env.WEBAPP_BOT_SECRET;
      
      console.log(`📡 Testing bot at: ${DISCORD_BOT_URL}`);
      
      const botSyncResponse = await fetch(`${DISCORD_BOT_URL}/api/sync-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WEBAPP_BOT_SECRET}`
        },
        body: JSON.stringify({
          action: 'assign',
          discordUserId: '123456789',
          discordRoleId: '987654321',
          allianceId: 790
        })
      });
      
      if (botSyncResponse.ok) {
        const botSyncResult = await botSyncResponse.json();
        console.log('✅ Discord bot sync endpoint working');
        console.log('📊 Result:', JSON.stringify(botSyncResult, null, 2));
      } else {
        const botSyncError = await botSyncResponse.text();
        console.log('❌ Discord bot sync failed:', botSyncResponse.status);
        console.log('📋 Error details:', botSyncError);
      }
    } catch (botError) {
      console.log('❌ Discord bot sync failed with exception:', botError.message);
    }
    
    console.log('');
    
    // Test 3: Test Discord bot health
    console.log('🧪 Test 3: Testing Discord bot health');
    
    try {
      const DISCORD_BOT_URL = process.env.DISCORD_BOT_API_URL || 'https://ot-production.up.railway.app';
      
      const healthResponse = await fetch(`${DISCORD_BOT_URL}/health`);
      
      if (healthResponse.ok) {
        const healthResult = await healthResponse.json();
        console.log('✅ Discord bot is online');
        console.log('📊 Bot status:', JSON.stringify(healthResult, null, 2));
      } else {
        const healthError = await healthResponse.text();
        console.log('❌ Discord bot health check failed:', healthResponse.status);
        console.log('📋 Error details:', healthError);
      }
    } catch (healthError) {
      console.log('❌ Discord bot health check failed with exception:', healthError.message);
    }
    
    console.log('');
    
    // Test 4: Environment variables check
    console.log('🧪 Test 4: Environment variables check');
    console.log('DISCORD_BOT_API_URL:', process.env.DISCORD_BOT_API_URL || 'not set');
    console.log('WEBAPP_BOT_SECRET:', process.env.WEBAPP_BOT_SECRET ? 'set (hidden)' : 'not set');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testSyncEndpoints();
}

module.exports = { testSyncEndpoints };