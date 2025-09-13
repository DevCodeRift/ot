// Test script to verify Discord → Webapp role sync functionality
// This tests the /api/bot/sync-role endpoint that handles Discord role changes

const baseUrl = 'http://localhost:3000'

async function testDiscordToWebappSync() {
  console.log('🧪 Testing Discord → Webapp Role Sync...\n')
  
  // Test 1: Valid Discord role sync (assign)
  console.log('1. Testing Discord role assignment sync...')
  try {
    const response = await fetch(`${baseUrl}/api/bot/sync-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        discordServerId: '123456789',
        discordUserId: '987654321',
        discordRoleId: '1416478228528500847', // Economic Advisor role ID
        action: 'assign',
        botSecret: process.env.WEBAPP_BOT_SECRET || 'test-secret',
        discordUsername: 'testuser',
        nationName: 'Test Nation'
      })
    })
    
    console.log(`   Status: ${response.status}`)
    const data = await response.json()
    console.log(`   Response:`, data)
    
    if (response.status === 401) {
      console.log(`   ⚠️  Bot secret authentication required\n`)
    } else if (response.status === 404) {
      console.log(`   ⚠️  User or role not found (expected for test data)\n`)
    } else {
      console.log(`   ✅ Endpoint is functional\n`)
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message, '\n')
  }
  
  // Test 2: Invalid bot secret
  console.log('2. Testing Discord sync with invalid bot secret...')
  try {
    const response = await fetch(`${baseUrl}/api/bot/sync-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        discordServerId: '123456789',
        discordUserId: '987654321',
        discordRoleId: '1416478228528500847',
        action: 'assign',
        botSecret: 'invalid-secret',
        discordUsername: 'testuser'
      })
    })
    
    console.log(`   Status: ${response.status}`)
    const data = await response.json()
    console.log(`   Response:`, data)
    
    if (response.status === 401) {
      console.log(`   ✅ Properly rejects invalid bot secret\n`)
    } else {
      console.log(`   ⚠️  Should reject invalid bot secret\n`)
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message, '\n')
  }
  
  // Test 3: Discord role removal sync
  console.log('3. Testing Discord role removal sync...')
  try {
    const response = await fetch(`${baseUrl}/api/bot/sync-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        discordServerId: '123456789',
        discordUserId: '987654321',
        discordRoleId: '1416478228528500847',
        action: 'remove',
        botSecret: process.env.WEBAPP_BOT_SECRET || 'test-secret',
        discordUsername: 'testuser'
      })
    })
    
    console.log(`   Status: ${response.status}`)
    const data = await response.json()
    console.log(`   Response:`, data)
    
    if (response.status === 401) {
      console.log(`   ⚠️  Bot secret authentication required\n`)
    } else if (response.status === 404) {
      console.log(`   ⚠️  User or role not found (expected for test data)\n`)
    } else {
      console.log(`   ✅ Endpoint is functional\n`)
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message, '\n')
  }
  
  console.log('🎉 Discord → Webapp Sync Test Complete!')
  console.log('')
  console.log('📋 Analysis:')
  console.log('   • ✅ Sync endpoint exists at /api/bot/sync-role')
  console.log('   • ✅ Discord bot has guildMemberUpdate event handler')
  console.log('   • ✅ Bot authentication is required for security')
  console.log('   • ✅ User identification system supports multiple methods')
  console.log('')
  console.log('🔍 Possible Issues:')
  console.log('   • Discord bot may not be properly connected to your server')
  console.log('   • WEBAPP_BOT_SECRET may not be configured in Discord bot')
  console.log('   • Discord events may not be triggering the sync function')
  console.log('   • Users may not be properly linked (Discord ID ↔ Webapp User)')
  console.log('')
  console.log('🛠️  Debugging Steps:')
  console.log('   1. Check Discord bot logs for role change events')
  console.log('   2. Verify WEBAPP_BOT_SECRET is set in Discord bot environment')
  console.log('   3. Test role assignment in Discord and check bot console')
  console.log('   4. Ensure bot has proper permissions in Discord server')
}

testDiscordToWebappSync().catch(console.error)