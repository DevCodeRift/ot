const fetch = require('node-fetch');

async function testRoleSync() {
  try {
    console.log('🧪 Testing individual role sync...\n');
    
    // First, let's get the roles for alliance 790
    console.log('📋 Getting roles for alliance 790...');
    const rolesResponse = await fetch('http://localhost:3000/api/alliance/roles?allianceId=790');
    
    if (!rolesResponse.ok) {
      console.log('❌ Failed to fetch roles:', rolesResponse.status, rolesResponse.statusText);
      return;
    }
    
    const roles = await rolesResponse.json();
    console.log('✅ Found', roles.length, 'roles');
    
    if (roles.length === 0) {
      console.log('⚠️  No roles found for alliance 790. Make sure you have created some roles first.');
      return;
    }
    
    // Find the "Membership Manager" role or use the first role
    let testRole = roles.find(role => role.name === 'Membership Manager') || roles[0];
    
    console.log('🎯 Testing sync for role:', testRole.name, '(ID:', testRole.id + ')');
    
    // Test the individual role sync
    const syncResponse = await fetch(`http://localhost:3000/api/alliance/roles/${testRole.id}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const syncResult = await syncResponse.json();
    
    if (syncResponse.ok) {
      console.log('✅ Role sync successful!');
      console.log('📊 Result:', JSON.stringify(syncResult, null, 2));
    } else {
      console.log('❌ Role sync failed:', syncResponse.status);
      console.log('📋 Error details:', JSON.stringify(syncResult, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testRoleSync();
}

module.exports = { testRoleSync };