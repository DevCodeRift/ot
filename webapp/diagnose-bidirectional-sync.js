// Diagnostic script to check Discord bot role sync configuration
// This helps identify why Discord → Webapp sync might not be working

const { PrismaClient } = require('@prisma/client')

async function diagnoseBidirectionalSync() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Diagnosing Discord ↔ Webapp Role Sync...\n')
    
    // Check 1: Verify users have Discord IDs linked
    console.log('1. Checking user Discord ID linkage...')
    const usersWithDiscord = await prisma.user.count({
      where: {
        currentAllianceId: 790,
        discordId: { not: null }
      }
    })
    
    const totalUsers = await prisma.user.count({
      where: { currentAllianceId: 790 }
    })
    
    console.log(`   • Users with Discord IDs: ${usersWithDiscord}/${totalUsers}`)
    
    if (usersWithDiscord === 0) {
      console.log(`   ⚠️  No users have Discord IDs linked - sync won't work`)
    } else {
      console.log(`   ✅ Some users have Discord IDs linked`)
    }
    
    // Check 2: Verify roles have Discord role IDs
    console.log('\n2. Checking role Discord ID linkage...')
    const rolesWithDiscordId = await prisma.allianceRole.count({
      where: {
        allianceId: 790,
        isActive: true,
        discordRoleId: { not: null }
      }
    })
    
    const totalRoles = await prisma.allianceRole.count({
      where: {
        allianceId: 790,
        isActive: true
      }
    })
    
    console.log(`   • Roles with Discord IDs: ${rolesWithDiscordId}/${totalRoles}`)
    
    if (rolesWithDiscordId === 0) {
      console.log(`   ❌ No roles have Discord IDs linked - sync won't work`)
    } else {
      console.log(`   ✅ All roles have Discord IDs linked`)
    }
    
    // Check 3: Test recent role assignments
    console.log('\n3. Checking recent role assignments...')
    const recentAssignments = await prisma.userAllianceRole.findMany({
      where: {
        allianceId: 790,
        isActive: true,
        assignedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        user: { select: { discordUsername: true, discordId: true } },
        role: { select: { name: true, discordRoleId: true } }
      },
      orderBy: { assignedAt: 'desc' },
      take: 10
    })
    
    console.log(`   • Recent assignments (last 24h): ${recentAssignments.length}`)
    
    for (const assignment of recentAssignments) {
      const syncType = assignment.assignedBy === 'DISCORD_SYNC' ? '🔄 Discord→Webapp' : '🌐 Webapp→Discord'
      console.log(`     ${syncType}: ${assignment.user.discordUsername || 'Unknown'} → ${assignment.role.name}`)
    }
    
    // Check 4: Discord server configuration
    console.log('\n4. Checking Discord server configuration...')
    const discordServers = await prisma.discordServer.findMany({
      where: {
        allianceId: 790,
        isActive: true
      }
    })
    
    console.log(`   • Configured Discord servers: ${discordServers.length}`)
    
    for (const server of discordServers) {
      console.log(`     Server ID: ${server.id}`)
    }
    
    if (discordServers.length === 0) {
      console.log(`   ⚠️  No Discord servers configured for alliance 790`)
    }
    
    console.log('\n📋 Diagnosis Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Webapp → Discord sync
    console.log('\n🌐 Webapp → Discord Sync:')
    if (rolesWithDiscordId > 0 && usersWithDiscord > 0) {
      console.log('   ✅ Should work - roles and users have Discord IDs')
    } else {
      console.log('   ❌ Won\'t work - missing Discord ID linkage')
    }
    
    // Discord → Webapp sync
    console.log('\n🔄 Discord → Webapp Sync:')
    const discordSyncAssignments = recentAssignments.filter(a => a.assignedBy === 'DISCORD_SYNC')
    
    if (discordSyncAssignments.length > 0) {
      console.log('   ✅ Working - found recent Discord sync assignments')
    } else if (rolesWithDiscordId > 0 && usersWithDiscord > 0 && discordServers.length > 0) {
      console.log('   ⚠️  Should work but no recent activity detected')
      console.log('   Check Discord bot logs and ensure:')
      console.log('     • Bot is connected to Discord server')
      console.log('     • Bot has "Manage Roles" permission')
      console.log('     • WEBAPP_BOT_SECRET is configured in Discord bot')
      console.log('     • guildMemberUpdate events are being received')
    } else {
      console.log('   ❌ Won\'t work - missing configuration')
    }
    
    console.log('\n🛠️  Next Steps:')
    if (usersWithDiscord === 0) {
      console.log('   1. Link user Discord accounts via OAuth login')
    }
    if (rolesWithDiscordId === 0) {
      console.log('   2. Use individual role sync to create Discord roles')
    }
    if (discordServers.length === 0) {
      console.log('   3. Configure Discord server for alliance 790')
    }
    console.log('   4. Test by manually assigning a role in Discord')
    console.log('   5. Check Discord bot logs for sync attempts')
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnoseBidirectionalSync().catch(console.error)