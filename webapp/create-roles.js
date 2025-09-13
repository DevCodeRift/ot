// Script to create comprehensive role set for alliance
// Run with: node -r dotenv/config create-roles.js <allianceId>

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createRoles() {
  const [,, allianceId] = process.argv
  
  if (!allianceId) {
    console.log('Usage: node -r dotenv/config create-roles.js <allianceId>')
    console.log('Example: node -r dotenv/config create-roles.js 790')
    process.exit(1)
  }

  try {
    console.log(`Creating roles for Alliance ID: ${allianceId}`)

    // Get the first alliance admin to use as creator
    const admin = await prisma.allianceAdmin.findFirst({
      where: { 
        allianceId: parseInt(allianceId),
        isActive: true 
      },
      include: { user: true }
    })

    if (!admin) {
      console.log('❌ No alliance admin found. Please run setup-admin.js first.')
      process.exit(1)
    }

    const creatorUserId = admin.user.id

    // Check existing roles
    const existingRoles = await prisma.allianceRole.findMany({
      where: { allianceId: parseInt(allianceId) }
    })

    console.log(`Found ${existingRoles.length} existing roles`)

    const rolesToCreate = [
      {
        name: 'Leadership',
        description: 'Alliance Leadership with full permissions',
        color: '#ff003c',
        canAssignRoles: true,
        canManageMembers: true,
        canViewWarData: true,
        canCreateQuests: true,
        canManageEconomics: true,
        canManageRecruitment: true,
        modulePermissions: ['membership', 'war', 'quests', 'economic', 'recruitment'],
        displayOrder: 0
      },
      {
        name: 'Officer',
        description: 'Alliance Officer with management permissions',
        color: '#fcee0a',
        canAssignRoles: true,
        canManageMembers: true,
        canViewWarData: true,
        canCreateQuests: true,
        canManageEconomics: false,
        canManageRecruitment: true,
        modulePermissions: ['membership', 'war', 'quests', 'recruitment'],
        displayOrder: 1
      },
      {
        name: 'War Coordinator',
        description: 'Manages war operations and strategies',
        color: '#ff6b35',
        canAssignRoles: false,
        canManageMembers: false,
        canViewWarData: true,
        canCreateQuests: true,
        canManageEconomics: false,
        canManageRecruitment: false,
        modulePermissions: ['war', 'quests'],
        displayOrder: 2
      },
      {
        name: 'Recruitment Manager',
        description: 'Handles recruitment and new member onboarding',
        color: '#b847ca',
        canAssignRoles: false,
        canManageMembers: true,
        canViewWarData: false,
        canCreateQuests: true,
        canManageEconomics: false,
        canManageRecruitment: true,
        modulePermissions: ['membership', 'recruitment', 'quests'],
        displayOrder: 3
      },
      {
        name: 'Economic Advisor',
        description: 'Manages alliance economics and banking',
        color: '#00ff9f',
        canAssignRoles: false,
        canManageMembers: false,
        canViewWarData: false,
        canCreateQuests: false,
        canManageEconomics: true,
        canManageRecruitment: false,
        modulePermissions: ['economic', 'membership'],
        displayOrder: 4
      },
      {
        name: 'Member',
        description: 'Standard alliance member',
        color: '#00f5ff',
        canAssignRoles: false,
        canManageMembers: false,
        canViewWarData: true,
        canCreateQuests: false,
        canManageEconomics: false,
        canManageRecruitment: false,
        modulePermissions: ['quests'],
        displayOrder: 5
      },
      {
        name: 'Recruit',
        description: 'New alliance recruit with limited access',
        color: '#666666',
        canAssignRoles: false,
        canManageMembers: false,
        canViewWarData: false,
        canCreateQuests: false,
        canManageEconomics: false,
        canManageRecruitment: false,
        modulePermissions: [],
        displayOrder: 6
      }
    ]

    let createdCount = 0
    let skippedCount = 0

    for (const roleData of rolesToCreate) {
      const existing = existingRoles.find(r => r.name === roleData.name)
      
      if (existing) {
        console.log(`⏭️  Skipped ${roleData.name} (already exists)`)
        skippedCount++
        continue
      }

      await prisma.allianceRole.create({
        data: {
          ...roleData,
          allianceId: parseInt(allianceId),
          createdBy: creatorUserId
        }
      })

      console.log(`✅ Created role: ${roleData.name}`)
      createdCount++
    }

    console.log(`\n🎉 Role creation complete!`)
    console.log(`   Created: ${createdCount} new roles`)
    console.log(`   Skipped: ${skippedCount} existing roles`)
    console.log(`   Total: ${existingRoles.length + createdCount} roles available`)
    
    console.log('\nRoles created with permissions:')
    console.log('• Leadership - Full access (red)')
    console.log('• Officer - Management access (yellow)')
    console.log('• War Coordinator - War operations (orange)')
    console.log('• Recruitment Manager - Member management (purple)')
    console.log('• Economic Advisor - Banking/economics (green)')
    console.log('• Member - Standard access (cyan)')
    console.log('• Recruit - Limited access (gray)')

  } catch (error) {
    console.error('Error creating roles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createRoles()