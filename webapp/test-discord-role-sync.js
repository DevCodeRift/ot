// Test script for Discord role synchronization system
// This tests user identification, placeholder user creation, and role sync

// Use built-in fetch in Node.js 18+
const { fetch } = globalThis;

const API_BASE = 'http://localhost:3000';
const TEST_SECRET = process.env.WEBAPP_BOT_SECRET || 'test-secret';

// Test data
const testCases = [
  {
    name: 'Existing User by Discord ID',
    data: {
      discordServerId: '1234567890',
      discordUserId: '123456789012345678', // Replace with real Discord ID from your DB
      discordRoleId: 'test-discord-role-1',
      action: 'assign',
      botSecret: TEST_SECRET
    },
    expectedStatus: 200
  },
  {
    name: 'Non-existent User - Should Create Placeholder',
    data: {
      discordServerId: '1234567890',
      discordUserId: '999999999999999999', // Non-existent Discord ID
      discordUsername: 'TestUser#1234',
      nationName: 'Test Nation',
      nationId: 123456,
      discordRoleId: 'test-discord-role-1',
      action: 'assign',
      botSecret: TEST_SECRET
    },
    expectedStatus: 200 // Should create placeholder and succeed
  },
  {
    name: 'Invalid Role ID',
    data: {
      discordServerId: '1234567890',
      discordUserId: '123456789012345678',
      discordRoleId: 'invalid-role-id',
      action: 'assign',
      botSecret: TEST_SECRET
    },
    expectedStatus: 404
  },
  {
    name: 'Remove Role from User',
    data: {
      discordServerId: '1234567890',
      discordUserId: '999999999999999999',
      discordRoleId: 'test-discord-role-1',
      action: 'remove',
      botSecret: TEST_SECRET
    },
    expectedStatus: 200
  },
  {
    name: 'Unauthorized Request',
    data: {
      discordServerId: '1234567890',
      discordUserId: '123456789012345678',
      discordRoleId: 'test-discord-role-1',
      action: 'assign',
      botSecret: 'wrong-secret'
    },
    expectedStatus: 401
  }
];

async function testRoleSync() {
  console.log('🧪 Testing Discord Role Synchronization System\n');

  // First, let's check if we have any test alliance roles
  console.log('📋 Checking for test data...');
  
  try {
    const rolesResponse = await fetch(`${API_BASE}/api/alliance/roles?allianceId=790`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (rolesResponse.ok) {
      const rolesData = await rolesResponse.json();
      console.log(`Found ${rolesData.roles?.length || 0} alliance roles`);
      
      // If we have roles, update test data with real role ID
      if (rolesData.roles && rolesData.roles.length > 0) {
        const testRole = rolesData.roles[0];
        console.log(`Using test role: ${testRole.name} (ID: ${testRole.id})`);
        
        // Update test cases with real role ID (if it has discordRoleId)
        if (testRole.discordRoleId) {
          testCases.forEach(testCase => {
            if (testCase.data.discordRoleId === 'test-discord-role-1') {
              testCase.data.discordRoleId = testRole.discordRoleId;
            }
          });
        } else {
          console.log('⚠️  Test role does not have discordRoleId set. Some tests may fail.');
        }
      }
    }
  } catch (error) {
    console.log('⚠️  Could not fetch alliance roles:', error.message);
  }

  console.log('\n🔄 Running test cases...\n');

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`${i + 1}. Testing: ${testCase.name}`);
    
    try {
      const response = await fetch(`${API_BASE}/api/bot/sync-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.data)
      });

      const responseData = await response.json();
      
      if (response.status === testCase.expectedStatus) {
        console.log(`   ✅ PASS - Status: ${response.status}`);
        
        if (responseData.success) {
          console.log(`   📝 Response: ${responseData.message}`);
          if (responseData.identifiedBy) {
            console.log(`   🔍 Identified by: ${responseData.identifiedBy}`);
          }
          if (responseData.isPlaceholderUser) {
            console.log(`   👤 Created placeholder user`);
          }
        } else {
          console.log(`   📝 Error: ${responseData.error}`);
          if (responseData.suggestions) {
            console.log(`   💡 Suggestions: ${responseData.suggestions.join(', ')}`);
          }
        }
      } else {
        console.log(`   ❌ FAIL - Expected status ${testCase.expectedStatus}, got ${response.status}`);
        console.log(`   📝 Response: ${JSON.stringify(responseData, null, 2)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🏁 Test completed!');
}

// Test user identification separately
async function testUserIdentification() {
  console.log('\n🔍 Testing User Identification System...\n');
  
  const identificationTests = [
    {
      name: 'Find by Discord ID',
      params: { discordUserId: '123456789012345678' }
    },
    {
      name: 'Find by Nation Name',
      params: { nationName: 'Test Nation' }
    },
    {
      name: 'Find by Nation ID',
      params: { nationId: 123456 }
    },
    {
      name: 'No matches - should suggest creation',
      params: { 
        discordUserId: '999888777666555444',
        discordUsername: 'NewUser#1234',
        allianceId: 790
      }
    }
  ];

  // We can't easily test the identification function directly without importing it
  // But we can test it through the role sync endpoint
  console.log('User identification is tested through the role sync endpoint above.');
  console.log('Check the "Identified by" field in the test results.\n');
}

// Main test runner
async function main() {
  console.log('🚀 Starting Discord Role Sync Tests\n');
  console.log(`Testing against: ${API_BASE}`);
  console.log(`Using bot secret: ${TEST_SECRET ? '[SET]' : '[NOT SET]'}\n`);

  if (!TEST_SECRET || TEST_SECRET === 'test-secret') {
    console.log('⚠️  Warning: Using default test secret. Set WEBAPP_BOT_SECRET environment variable for real testing.\n');
  }

  await testUserIdentification();
  await testRoleSync();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRoleSync, testUserIdentification };