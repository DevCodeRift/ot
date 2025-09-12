// Check and enable quest module for alliance 790
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAndEnableQuestModule() {
  try {
    console.log('🔍 Checking quest module status for alliance 790...')
    
    // Check if quest module exists
    const questModule = await prisma.module.findUnique({
      where: { name: 'quests' }
    })
    
    if (!questModule) {
      console.log('❌ Quest module not found in database')
      // Create the quest module
      const newModule = await prisma.module.create({
        data: {
          name: 'quests',
          description: 'Quest and task management system',
          category: 'member-mgmt',
          requiredPerms: ['member'],
          isActive: true
        }
      })
      console.log('✅ Created quest module:', newModule.id)
    } else {
      console.log('✅ Quest module found:', questModule.id)
    }
    
    // Check if alliance 790 has access
    const allianceModule = await prisma.allianceModule.findUnique({
      where: {
        allianceId_moduleId: {
          allianceId: 790,
          moduleId: questModule?.id || 'quests'
        }
      }
    })
    
    if (!allianceModule) {
      console.log('❌ Alliance 790 does not have quest module access')
      // Enable module for alliance 790
      const enabledModule = await prisma.allianceModule.create({
        data: {
          allianceId: 790,
          moduleId: questModule?.id || 'quests',
          enabled: true,
          enabledBy: 'system-init',
          enabledAt: new Date()
        }
      })
      console.log('✅ Enabled quest module for alliance 790:', enabledModule.id)
    } else {
      console.log('✅ Alliance 790 already has quest module access:', allianceModule.enabled ? 'ENABLED' : 'DISABLED')
      
      if (!allianceModule.enabled) {
        // Enable it
        await prisma.allianceModule.update({
          where: { id: allianceModule.id },
          data: { enabled: true }
        })
        console.log('✅ Enabled quest module for alliance 790')
      }
    }
    
    console.log('🎉 Quest module is now available for alliance 790')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndEnableQuestModule()