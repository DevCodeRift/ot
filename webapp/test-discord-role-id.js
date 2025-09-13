// Simple test to verify the discordRoleId field is working
console.log('Testing Discord Role ID field...');

// Test if we can access the API
const testAPI = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/test/database');
    const data = await response.json();
    console.log('Database test:', data.status || 'connected');
    
    // Test the alliance roles endpoint
    const rolesResponse = await fetch('http://localhost:3000/api/alliance/roles?allianceId=790');
    
    if (rolesResponse.ok) {
      const rolesData = await rolesResponse.json();
      console.log('Alliance roles endpoint: WORKING');
      
      if (rolesData.roles && rolesData.roles.length > 0) {
        const hasDiscordRoleId = rolesData.roles[0].hasOwnProperty('discordRoleId');
        console.log('discordRoleId field present:', hasDiscordRoleId);
        
        if (hasDiscordRoleId) {
          console.log('✅ SUCCESS: discordRoleId field is available');
        } else {
          console.log('❌ ERROR: discordRoleId field is missing');
        }
      } else {
        console.log('No roles found to test discordRoleId field');
      }
    } else {
      console.log('Alliance roles endpoint error:', rolesResponse.status);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

testAPI();