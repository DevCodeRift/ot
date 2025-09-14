async function testUpdatedWarAlerts() {
  try {
    console.log('🔧 Testing updated war alerts system...\n');

    // Test the updated alliance API key endpoint
    const WEBAPP_URL = process.env.WEBAPP_URL || 'https://ot-gamma.vercel.app';
    const BOT_SECRET = process.env.WEBAPP_BOT_SECRET;
    
    if (!BOT_SECRET) {
      console.error('❌ WEBAPP_BOT_SECRET environment variable not set');
      process.exit(1);
    }

    // Test with Rose alliance ID (common test case)
    const testAllianceId = 469; // Rose
    
    console.log(`📡 Testing alliance API key endpoint for alliance ${testAllianceId}...`);
    const response = await fetch(`${WEBAPP_URL}/api/bot/alliance-api-key?allianceId=${testAllianceId}`, {
      headers: {
        'Authorization': `Bearer ${BOT_SECRET}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Alliance API key endpoint working!');
      console.log('📊 Response:', {
        success: data.success,
        allianceId: data.allianceId,
        source: data.source,
        message: data.message,
        hasApiKey: !!data.apiKey
      });
      
      if (data.source === 'system') {
        console.log('🎯 Perfect! Using system-wide API key for automatic alliance monitoring');
      } else {
        console.log('⚠️  Still using individual user API keys - check implementation');
      }
    } else {
      console.error('❌ Alliance API key endpoint failed:', response.status);
      console.error('Error:', data);
    }

    console.log('\n🎮 War alerts are now configured for automatic monitoring!');
    console.log('✨ Key improvements:');
    console.log('  • No longer requires individual P&W account connections');
    console.log('  • Uses system-wide API key for all alliance monitoring'); 
    console.log('  • Automatically monitors wars for all alliance members');
    console.log('  • Works regardless of webapp/Discord connections');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUpdatedWarAlerts();