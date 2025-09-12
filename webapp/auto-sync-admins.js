// Auto-sync alliance administrators from existing data
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function autoSyncAllianceAdmins() {
  try {
    console.log('🔄 Auto-syncing alliance administrators...')
    
    // Find all alliance admin records that have Discord IDs but no linked users
    const orphanedAdmins = await prisma.allianceAdmin.findMany({
      where: {
        OR: [
          { userId: null },
          { user: null }
        ],
        discordId: { not: null }
      },
      include: {
        alliance: true
      }
    })
    
    console.log(`Found ${orphanedAdmins.length} orphaned admin records`)
    
    let linkedCount = 0
    let createdCount = 0
    
    for (const admin of orphanedAdmins) {
      console.log(`\n🔍 Processing admin for ${admin.alliance.name} (${admin.allianceId})`)
      console.log(`   Discord ID: ${admin.discordId}, Role: ${admin.role}`)
      
      // Find user with matching Discord ID
      const user = await prisma.user.findUnique({
        where: { discordId: admin.discordId }
      })
      
      if (user) {
        console.log(`   ✅ Found user: ${user.name || user.discordUsername}`)
        
        // Check if user already has admin record
        const existingUserAdmin = await prisma.allianceAdmin.findFirst({
          where: {
            allianceId: admin.allianceId,
            userId: user.id,
            isActive: true
          }
        })
        
        if (existingUserAdmin) {
          console.log(`   ℹ️  User already has admin record, deleting orphaned record`)
          await prisma.allianceAdmin.delete({
            where: { id: admin.id }
          })
        } else {
          console.log(`   🔗 Linking orphaned admin record to user`)
          await prisma.allianceAdmin.update({
            where: { id: admin.id },
            data: { userId: user.id }
          })
          linkedCount++
        }
      } else {
        console.log(`   ❌ No user found with Discord ID ${admin.discordId}`)
      }
    }
    
    // Now check for users who should be admins but aren't
    console.log('\n🔍 Checking for users who should be admins...')
    
    // Find all alliances
    const alliances = await prisma.alliance.findMany({
      include: {
        nations: {
          include: {
            user: true
          }
        },
        allianceAdmins: {
          where: { isActive: true }
        }
      }
    })
    
    for (const alliance of alliances) {
      // Skip if alliance already has active admins
      if (alliance.allianceAdmins.length > 0) {
        continue
      }
      
      console.log(`\n🏛️  Alliance ${alliance.name} (${alliance.id}) has no active admins`)
      
      // Find users with API keys in this alliance
      const potentialAdmins = alliance.nations
        .filter(nation => nation.user && nation.user.pwApiKey)
        .map(nation => nation.user)
      
      if (potentialAdmins.length > 0) {
        // Make the first one an admin
        const firstAdmin = potentialAdmins[0]
        console.log(`   👑 Making ${firstAdmin.name || firstAdmin.discordUsername} an admin`)
        
        await prisma.allianceAdmin.create({
          data: {
            allianceId: alliance.id,
            userId: firstAdmin.id,
            discordId: firstAdmin.discordId || 'unknown',
            role: 'admin',
            permissions: ['quest_management', 'member_management', 'alliance_admin'],
            isActive: true,
            addedBy: firstAdmin.id
          }
        })
        createdCount++
      }
    }
    
    console.log(`\n🎉 Auto-sync complete:`)
    console.log(`   - ${linkedCount} orphaned records linked`)
    console.log(`   - ${createdCount} new admin records created`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

autoSyncAllianceAdmins()