// Test script to debug Discord bot role sync issues
// This tests the enhanced logging and diagnostic endpoints

async function testEnhancedDiscordBot() {
  console.log('🔍 Testing Enhanced Discord Bot Functionality...\n')
  
  const botUrl = 'https://ot-production.up.railway.app'
  
  // Test 1: Check bot status and connections
  console.log('1. Checking bot status and guild connections...')
  try {
    const response = await fetch(`${botUrl}/api/bot-status`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`   Bot Ready: ${data.botReady}`)
      console.log(`   Bot Tag: ${data.botTag}`)
      console.log(`   Connected Guilds: ${data.guildsCount}`)
      console.log(`   Target Guild Connected: ${data.targetGuildConnected}`)
      console.log(`   Uptime: ${Math.floor(data.uptime / 60)} minutes`)
      
      if (data.guilds && data.guilds.length > 0) {
        console.log('   Guild Details:')
        data.guilds.forEach(guild => {
          console.log(`     • ${guild.name} (${guild.id}) - ${guild.memberCount} members`)
          if (guild.id === '1407812256636469470') {
            console.log(`       ✅ This is your target guild`)
            console.log(`       Bot permissions: ${guild.botPermissions.slice(0, 5).join(', ')}${guild.botPermissions.length > 5 ? '...' : ''}`)
          }
        })
      }
      
      if (data.targetGuildConnected) {
        console.log(`   ✅ Bot is connected to target Discord server`)
      } else {
        console.log(`   ❌ Bot is NOT connected to target Discord server`)
      }
    } else {
      console.log(`   ❌ Failed to get bot status: ${response.status}`)
    }
  } catch (error) {
    console.log(`   ❌ Error checking bot status:`, error.message)
  }
  
  console.log('\n2. Testing manual role sync trigger...')
  try {
    // Test with known Discord IDs
    const testPayload = {
      guildId: '1407812256636469470',  // Your Discord server
      userId: '123456789012345678',    // Test user ID
      roleId: '1416478237412032667',   // Recruit role ID
      action: 'assign'
    }
    
    console.log(`   Testing sync: ${testPayload.action} role ${testPayload.roleId}`)
    
    const response = await fetch(`${botUrl}/api/test-role-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`   ✅ Manual sync test completed`)
      console.log(`   Guild Found: ${data.guildInfo.found} (${data.guildInfo.name})`)
      console.log(`   Member Found: ${data.memberInfo.found} (${data.memberInfo.username || 'N/A'})`)
      console.log(`   Role Found: ${data.roleInfo.found} (${data.roleInfo.name || 'N/A'})`)
      console.log(`   Sync Result: ${data.syncResult.success ? 'Success' : 'Failed'}`)
      
      if (!data.syncResult.success) {
        console.log(`   Sync Error: ${data.syncResult.error}`)
      }
    } else {
      const errorText = await response.text()
      console.log(`   ❌ Manual sync test failed: ${response.status}`)
      console.log(`   Error: ${errorText}`)
    }
  } catch (error) {
    console.log(`   ❌ Error testing manual sync:`, error.message)
  }
  
  console.log('\n📋 Enhanced Bot Analysis:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  console.log('\n✨ Enhanced Features Added:')
  console.log('   • ✅ Detailed debug logging for guildMemberUpdate events')
  console.log('   • ✅ Bot status and guild connection diagnostics')
  console.log('   • ✅ Manual role sync testing endpoint')
  console.log('   • ✅ Ready event logging with permission details')
  console.log('   • ✅ Enhanced error reporting and suggestions')
  
  console.log('\n🔍 What to Watch For:')
  console.log('   1. Check Railway logs for "[DEBUG]" and "[ROLE SYNC]" messages')
  console.log('   2. Look for "Guild member update detected" when assigning roles')
  console.log('   3. Verify bot has "Manage Roles" permission in Discord')
  console.log('   4. Ensure the user being tested has a Discord ID linked in webapp')
  
  console.log('\n🛠️  Next Test Steps:')
  console.log('   1. Deploy this enhanced bot to Railway')
  console.log('   2. Assign the "Recruit" role to a real user in Discord')
  console.log('   3. Check Railway logs immediately after assignment')
  console.log('   4. Look for the detailed debug output')
}

testEnhancedDiscordBot().catch(console.error)