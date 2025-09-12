import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function enableQuestModule() {
  try {
    console.log('Adding Quest module to the system...')

    // Create or update the quest module
    const questModule = await prisma.module.upsert({
      where: { name: 'quests' },
      update: {
        description: 'Quest and task management system for alliance members',
        category: 'member-mgmt',
        requiredPerms: ['admin', 'officer'],
        isActive: true
      },
      create: {
        name: 'quests',
        description: 'Quest and task management system for alliance members',
        category: 'member-mgmt',
        requiredPerms: ['admin', 'officer'],
        isActive: true
      }
    })

    console.log('Quest module created/updated:', questModule.id)

    // Get all alliances to enable the module for them
    const alliances = await prisma.alliance.findMany({
      select: { id: true, name: true }
    })

    console.log(`Found ${alliances.length} alliances to enable quest module for`)

    // Enable quest module for all alliances
    for (const alliance of alliances) {
      const allianceModule = await prisma.allianceModule.upsert({
        where: {
          allianceId_moduleId: {
            allianceId: alliance.id,
            moduleId: questModule.id
          }
        },
        update: {
          enabled: true,
          settings: {
            autoProgressTracking: true,
            milestoneNotifications: true,
            completionNotifications: true,
            maxActiveQuests: 10
          }
        },
        create: {
          allianceId: alliance.id,
          moduleId: questModule.id,
          enabled: true,
          settings: {
            autoProgressTracking: true,
            milestoneNotifications: true,
            completionNotifications: true,
            maxActiveQuests: 10
          }
        }
      })

      console.log(`✓ Enabled quest module for alliance: ${alliance.name} (${alliance.id})`)
    }

    console.log('\\n✅ Quest module successfully enabled for all alliances!')
    console.log('\\nQuest system features now available:')
    console.log('- Create and manage quest groups')
    console.log('- Create modular quests with P&W API metrics')
    console.log('- Assign quests to alliance members')
    console.log('- Automated progress tracking')
    console.log('- Quest completion notifications')
    console.log('- Admin quest management interface')

  } catch (error) {
    console.error('Error enabling quest module:', error)
  } finally {
    await prisma.$disconnect()
  }
}

enableQuestModule()
