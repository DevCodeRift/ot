// Check and add admin permissions for alliance 790
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAndAddAdminPermissions() {
  try {
    console.log('🔍 Checking admin permissions for alliance 790...')
    
    // Check if AllianceAdmin table exists and has data
    const allAdmins = await prisma.allianceAdmin.findMany({
      where: { allianceId: 790 },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            discordUsername: true,
            pwNationName: true
          }
        }
      }
    })
    
    console.log(`Found ${allAdmins.length} admins for alliance 790:`)
    allAdmins.forEach(admin => {
      console.log(`- ${admin.user.name || admin.user.discordUsername} (${admin.role}) - Active: ${admin.isActive}`)
    })
    
    if (allAdmins.length === 0) {
      console.log('❌ No admins found for alliance 790')
      
      // Get all users who might be admins (users with API keys)
      const usersWithApiKeys = await prisma.user.findMany({
        where: {
          pwApiKey: { not: null },
          currentAllianceId: 790
        },
        select: {
          id: true,
          name: true,
          discordId: true,
          discordUsername: true,
          pwNationName: true,
          pwNationId: true
        }
      })
      
      console.log(`Found ${usersWithApiKeys.length} users with API keys in alliance 790:`)
      usersWithApiKeys.forEach(user => {
        console.log(`- ${user.name || user.discordUsername} (Nation: ${user.pwNationName})`)
      })
      
      if (usersWithApiKeys.length > 0) {
        // Add the first user as admin
        const firstUser = usersWithApiKeys[0]
        const newAdmin = await prisma.allianceAdmin.create({
          data: {
            allianceId: 790,
            userId: firstUser.id,
            discordId: firstUser.discordId || 'unknown',
            role: 'admin',
            permissions: ['quest_management', 'member_management', 'alliance_admin'],
            isActive: true,
            addedBy: firstUser.id, // Self-assigned for system init
            addedAt: new Date()
          }
        })
        
        console.log(`✅ Added ${firstUser.name || firstUser.discordUsername} as admin for alliance 790`)
        
        // If there are more users, add them too
        for (let i = 1; i < usersWithApiKeys.length; i++) {
          const user = usersWithApiKeys[i]
          await prisma.allianceAdmin.create({
            data: {
              allianceId: 790,
              userId: user.id,
              discordId: user.discordId || 'unknown',
              role: 'admin',
              permissions: ['quest_management', 'member_management'],
              isActive: true,
              addedBy: firstUser.id,
              addedAt: new Date()
            }
          })
          console.log(`✅ Added ${user.name || user.discordUsername} as admin for alliance 790`)
        }
      } else {
        console.log('❌ No users found with API keys in alliance 790')
      }
    }
    
    console.log('🎉 Admin permissions check complete')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndAddAdminPermissions()