// Test script to directly trigger a war alert via bot webhook

async function testBotWarAlert() {
  try {
    console.log('🤖 Testing Direct Bot War Alert...\n');

    const BOT_URL = 'https://ot-production.up.railway.app';
    const WEBAPP_BOT_SECRET = '91b69aaa60bbb111f79bb43a91651df0b47a0a81c5a5ef0fa657a5de4023040a';

    // Test bot status first
    console.log('📡 Checking bot status...');
    const statusResponse = await fetch(`${BOT_URL}/status`);
    
    if (statusResponse.ok) {
      const status = await statusResponse.text();
      console.log('✅ Bot is online:', status);
    } else {
      console.log('❌ Bot status check failed:', statusResponse.status);
    }

    // Test webhook endpoint to trigger war alert
    console.log('\n🚨 Attempting to trigger test war alert...');
    
    const mockWarData = {
      wars: [{
        id: "999999",
        date: new Date().toISOString(),
        reason: "Manual Test Alert",
        war_type: "Ordinary War",
        att_id: "123456",
        def_id: "789012",
        att_alliance_id: "790", // Rose
        def_alliance_id: "0",
        attacker: {
          id: "123456",
          nation_name: "Test Attacker",
          leader_name: "Test Leader"
        },
        defender: {
          id: "789012",
          nation_name: "Test Defender", 
          leader_name: "Test Defender Leader"
        }
      }]
    };

    // Send to bot webhook (if it exists)
    const webhookResponse = await fetch(`${BOT_URL}/webhook/war-alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBAPP_BOT_SECRET}`
      },
      body: JSON.stringify(mockWarData)
    });

    if (webhookResponse.ok) {
      console.log('✅ War alert webhook succeeded');
    } else {
      console.log(`❌ War alert webhook failed: ${webhookResponse.status}`);
      const error = await webhookResponse.text();
      console.log('Error details:', error);
    }

    // Alternative: Test if bot has any debugging endpoints
    console.log('\n🔍 Testing bot debugging endpoints...');
    
    const endpoints = [
      '/health',
      '/debug',
      '/logs',
      '/wars/test'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BOT_URL}${endpoint}`);
        console.log(`${endpoint}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`${endpoint}: Connection failed`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBotWarAlert();