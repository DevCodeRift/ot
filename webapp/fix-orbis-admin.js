// Fix Orbis Tech alliance admin linkage
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixOrbisAdminLinkage() {
  try {
    const discordId = '469629016421171252'
    const allianceId = 14322
    
    console.log('🔧 Fixing Orbis Tech alliance admin linkage...')
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { discordId }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log(`✅ Found user: ${user.name || user.discordUsername} (${user.id})`)
    
    // Check existing admin records for this alliance
    const existingAdmins = await prisma.allianceAdmin.findMany({
      where: { allianceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            discordId: true,
            discordUsername: true
          }
        }
      }
    })
    
    console.log(`Found ${existingAdmins.length} existing admin records:`)
    existingAdmins.forEach(admin => {
      console.log(`- Admin ID: ${admin.id}, User: ${admin.user?.name || 'Unknown'}, Discord: ${admin.discordId}, Role: ${admin.role}`)
    })
    
    // Check if user already has admin record
    const userAdminRecord = existingAdmins.find(admin => admin.userId === user.id)
    
    if (userAdminRecord) {
      console.log('✅ User already has admin record')
      if (!userAdminRecord.isActive) {
        await prisma.allianceAdmin.update({
          where: { id: userAdminRecord.id },
          data: { isActive: true }
        })
        console.log('✅ Activated existing admin record')
      }
    } else {
      // Check if there's an orphaned admin record with matching Discord ID but no user
      const orphanedAdmin = existingAdmins.find(admin => 
        admin.discordId === discordId && !admin.user
      )
      
      if (orphanedAdmin) {
        console.log('🔗 Found orphaned admin record, linking to user...')
        await prisma.allianceAdmin.update({
          where: { id: orphanedAdmin.id },
          data: { 
            userId: user.id,
            isActive: true
          }
        })
        console.log('✅ Linked orphaned admin record to user')
      } else {
        console.log('➕ Creating new admin record for user...')
        await prisma.allianceAdmin.create({
          data: {
            allianceId,
            userId: user.id,
            discordId: user.discordId,
            role: 'owner',
            permissions: ['quest_management', 'member_management', 'alliance_admin', 'all_modules'],
            isActive: true,
            addedBy: user.id // Self-assigned
          }
        })
        console.log('✅ Created new admin record')
      }
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...')
    const updatedAdmin = await prisma.allianceAdmin.findFirst({
      where: {
        allianceId,
        userId: user.id,
        isActive: true
      },
      include: {
        user: {
          select: {
            name: true,
            discordUsername: true,
            discordId: true
          }
        }
      }
    })
    
    if (updatedAdmin) {
      console.log('✅ Admin access confirmed:')
      console.log(`- User: ${updatedAdmin.user.name || updatedAdmin.user.discordUsername}`)
      console.log(`- Discord: ${updatedAdmin.user.discordId}`)
      console.log(`- Role: ${updatedAdmin.role}`)
      console.log(`- Permissions: ${updatedAdmin.permissions.join(', ')}`)
      console.log(`- Active: ${updatedAdmin.isActive}`)
    } else {
      console.log('❌ Admin access verification failed')
    }
    
    console.log('\n🎉 Orbis Tech admin linkage fix complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixOrbisAdminLinkage()