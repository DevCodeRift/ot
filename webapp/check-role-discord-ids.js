// Quick check to see if roles have discordRoleId populated
// This helps diagnose if Discord sync will work

const { PrismaClient } = require('@prisma/client')

async function checkRoleDiscordIds() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking Alliance Roles for Discord IDs...\n')
    
    // Get roles for alliance 790 (the one being tested)
    const roles = await prisma.allianceRole.findMany({
      where: {
        allianceId: 790,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        discordRoleId: true
      }
    })
    
    console.log(`Found ${roles.length} active roles for alliance 790:\n`)
    
    let rolesWithDiscordId = 0
    let rolesWithoutDiscordId = 0
    
    for (const role of roles) {
      if (role.discordRoleId) {
        console.log(`✅ ${role.name} → Discord ID: ${role.discordRoleId}`)
        rolesWithDiscordId++
      } else {
        console.log(`❌ ${role.name} → No Discord ID`)
        rolesWithoutDiscordId++
      }
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   • Roles with Discord IDs: ${rolesWithDiscordId}`)
    console.log(`   • Roles without Discord IDs: ${rolesWithoutDiscordId}`)
    
    if (rolesWithoutDiscordId > 0) {
      console.log(`\n⚠️  Discord sync will only work for roles that have Discord IDs`)
      console.log(`   Use the individual role sync feature to create Discord roles first`)
      console.log(`   Or manually link existing Discord roles to webapp roles`)
    }
    
    if (rolesWithDiscordId > 0) {
      console.log(`\n✅ Roles with Discord IDs are ready for bidirectional sync`)
    }
    
  } catch (error) {
    console.error('❌ Error checking roles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRoleDiscordIds().catch(console.error)