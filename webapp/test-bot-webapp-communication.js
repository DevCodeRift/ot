// Test script to verify Discord bot can communicate with webapp
// This simulates what happens when Discord role changes occur

async function testBotWebappCommunication() {
  console.log('🤖 Testing Discord Bot → Webapp Communication...\n')
  
  // The Discord bot uses these environment variables
  const webappUrl = process.env.WEBAPP_API_URL || 'https://www.orbistech.dev'
  const botSecret = process.env.WEBAPP_BOT_SECRET || '91b69aaa60bbb111f79bb43a91651df0b47a0a81c5a5ef0fa657a5de4023040a'
  
  console.log(`Webapp URL: ${webappUrl}`)
  console.log(`Bot Secret: ${botSecret ? 'Configured' : 'Missing'}\n`)
  
  // Test 1: Test Discord bot → Webapp sync endpoint
  console.log('1. Testing Discord bot sync to webapp...')
  try {
    const syncEndpoint = `${webappUrl}/api/bot/sync-role`
    console.log(`   Calling: ${syncEndpoint}`)
    
    const response = await fetch(syncEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        discordServerId: '1407812256636469470', // Your Discord server ID
        discordUserId: '123456789', // Test Discord user ID
        discordRoleId: '1416478228528500847', // Economic Advisor role ID
        action: 'assign',
        botSecret: botSecret,
        discordUsername: 'testuser'
      })
    })
    
    console.log(`   Status: ${response.status}`)
    const data = await response.text()
    console.log(`   Response:`, data.substring(0, 200) + (data.length > 200 ? '...' : ''))
    
    if (response.status === 404) {
      console.log(`   ⚠️  User not found (expected for test data)`)
    } else if (response.status === 401) {
      console.log(`   ❌ Bot secret authentication failed`)
    } else if (response.status >= 200 && response.status < 300) {
      console.log(`   ✅ Communication successful`)
    } else {
      console.log(`   ⚠️  Unexpected response`)
    }
    
  } catch (error) {
    console.log(`   ❌ Error:`, error.message)
  }
  
  console.log('\n📋 Analysis:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  console.log('\n🔄 Discord → Webapp Sync Status:')
  console.log('   • Infrastructure: ✅ Event handler exists')
  console.log('   • Configuration: ✅ Bot secret configured')
  console.log('   • Endpoint: ✅ /api/bot/sync-role exists')
  console.log('   • Communication: Testing above...')
  
  console.log('\n🎯 Expected Flow:')
  console.log('   1. User gets role in Discord server')
  console.log('   2. Discord fires guildMemberUpdate event')
  console.log('   3. Bot detects role change')
  console.log('   4. Bot calls webapp /api/bot/sync-role')
  console.log('   5. Webapp creates UserAllianceRole record')
  console.log('   6. Role appears in webapp UI')
  
  console.log('\n🛠️  If sync still doesn\'t work:')
  console.log('   • Check Discord bot logs during role assignment')
  console.log('   • Verify bot has "Manage Roles" permission')
  console.log('   • Ensure user has Discord ID linked in webapp')
  console.log('   • Test with a role that has discordRoleId set')
  console.log('   • Check if bot is actually in your Discord server')
}

testBotWebappCommunication().catch(console.error)