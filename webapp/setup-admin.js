// Quick script to make a user an alliance admin for role management testing
// Run with: node -r dotenv/config setup-admin.js <discordId> <allianceId>

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupAdmin() {
  const [,, discordId, allianceId] = process.argv
  
  if (!discordId || !allianceId) {
    console.log('Usage: node setup-admin.js <discordId> <allianceId>')
    console.log('Example: node setup-admin.js 123456789 7452')
    process.exit(1)
  }

  try {
    console.log(`Setting up admin for Discord ID: ${discordId}, Alliance ID: ${allianceId}`)

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { discordId }
    })

    if (!user) {
      console.log('Creating new user...')
      user = await prisma.user.create({
        data: {
          discordId,
          currentAllianceId: parseInt(allianceId)
        }
      })
    } else {
      console.log('Found existing user, updating alliance...')
      user = await prisma.user.update({
        where: { discordId },
        data: { currentAllianceId: parseInt(allianceId) }
      })
    }

    // Check if already an admin
    const existingAdmin = await prisma.allianceAdmin.findFirst({
      where: {
        allianceId: parseInt(allianceId),
        userId: user.id
      }
    })

    if (existingAdmin) {
      console.log('✅ User is already an alliance admin')
    } else {
      console.log('Creating alliance admin record...')
      await prisma.allianceAdmin.create({
        data: {
          allianceId: parseInt(allianceId),
          userId: user.id,
          discordId,
          role: 'admin',
          addedBy: discordId,
          addedAt: new Date()
        }
      })
      console.log('✅ Alliance admin created')
    }

    // Create some basic roles if they don't exist
    const existingRoles = await prisma.allianceRole.findMany({
      where: { allianceId: parseInt(allianceId) }
    })

    if (existingRoles.length === 0) {
      console.log('Creating default roles...')
      
      // Create Officer role
      await prisma.allianceRole.create({
        data: {
          allianceId: parseInt(allianceId),
          name: 'Officer',
          description: 'Alliance Officer with management permissions',
          color: '#fcee0a',
          canAssignRoles: true,
          canManageMembers: true,
          canViewWarData: true,
          canCreateQuests: true,
          modulePermissions: ['membership', 'war', 'quests'],
          displayOrder: 1,
          createdBy: user.id
        }
      })

      // Create Member role
      await prisma.allianceRole.create({
        data: {
          allianceId: parseInt(allianceId),
          name: 'Member',
          description: 'Standard alliance member',
          color: '#00f5ff',
          canViewWarData: true,
          modulePermissions: ['quests'],
          displayOrder: 2,
          createdBy: user.id
        }
      })

      // Create Recruit role
      await prisma.allianceRole.create({
        data: {
          allianceId: parseInt(allianceId),
          name: 'Recruit',
          description: 'New alliance recruit',
          color: '#666666',
          modulePermissions: [],
          displayOrder: 3,
          createdBy: user.id
        }
      })

      console.log('✅ Created 3 default roles: Officer, Member, Recruit')
    } else {
      console.log(`Found ${existingRoles.length} existing roles`)
    }

    console.log('\n🎉 Setup complete!')
    console.log('You can now access role management in the webapp')

  } catch (error) {
    console.error('Error setting up admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAdmin()