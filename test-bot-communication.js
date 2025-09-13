// Test script to verify webapp-bot communication
const testBotConnection = async () => {
  console.log('Testing webapp to bot communication...');
  
  try {
    // Test bot health endpoint
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('✅ Bot health check:', data);
    
    // Test webapp API for bot connection
    const webappResponse = await fetch('http://localhost:3000/api/bot/test-connection');
    const webappData = await webappResponse.json();
    console.log('✅ Webapp bot API:', webappData);
    
  } catch (error) {
    console.error('❌ Communication test failed:', error.message);
  }
};

testBotConnection();