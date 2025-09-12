// Check users and alliances for Discord ID 469629016421171252
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserAndAlliance() {
  try {
    const discordId = '469629016421171252'
    console.log(`🔍 Checking data for Discord ID: ${discordId}`)
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { discordId },
      include: {
        nation: true,
        allianceAdminRoles: {
          include: {
            alliance: true
          }
        }
      }
    })
    
    if (user) {
      console.log('✅ User found:')
      console.log(`- ID: ${user.id}`)
      console.log(`- Name: ${user.name || 'N/A'}`)
      console.log(`- Discord: ${user.discordUsername || 'N/A'}`)
      console.log(`- Nation: ${user.pwNationName || 'N/A'} (ID: ${user.pwNationId || 'N/A'})`)
      console.log(`- Current Alliance: ${user.currentAllianceId || 'N/A'}`)
      console.log(`- Admin Roles: ${user.allianceAdminRoles.length}`)
      
      user.allianceAdminRoles.forEach(role => {
        console.log(`  - Alliance: ${role.alliance.name} (${role.allianceId}) - Role: ${role.role}`)
      })
    } else {
      console.log('❌ User not found')
    }
    
    // Check Orbis Tech alliance (14322)
    console.log('\n🔍 Checking Orbis Tech alliance (14322):')
    const alliance = await prisma.alliance.findUnique({
      where: { id: 14322 },
      include: {
        allianceAdmins: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                discordId: true,
                discordUsername: true,
                pwNationName: true
              }
            }
          },
          where: { isActive: true }
        },
        nations: {
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
        }
      }
    })
    
    if (alliance) {
      console.log(`✅ Alliance found: ${alliance.name}`)
      console.log(`- ID: ${alliance.id}`)
      console.log(`- Members: ${alliance.nations.length}`)
      console.log(`- Admins: ${alliance.allianceAdmins.length}`)
      
      console.log('\nAdmins:')
      alliance.allianceAdmins.forEach(admin => {
        console.log(`- ${admin.user.name || admin.user.discordUsername || 'Unknown'} (Discord: ${admin.user.discordId}) - Role: ${admin.role}`)
      })
      
      console.log('\nMembers:')
      alliance.nations.forEach(nation => {
        if (nation.user) {
          console.log(`- ${nation.nation_name} (${nation.user.name || nation.user.discordUsername || 'Unknown'}, Discord: ${nation.user.discordId || 'N/A'})`)
        } else {
          console.log(`- ${nation.nation_name} (No user linked)`)
        }
      })
      
      // Check if the Discord user is a member but not an admin
      const memberUser = alliance.nations.find(nation => 
        nation.user?.discordId === discordId
      )
      
      if (memberUser && !alliance.allianceAdmins.find(admin => admin.user.discordId === discordId)) {
        console.log(`\n⚠️  User ${memberUser.user.name || memberUser.user.discordUsername} is a member but not an admin`)
        console.log('   This user should be promoted to admin for quest management')
      }
    } else {
      console.log('❌ Alliance 14322 not found')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserAndAlliance()