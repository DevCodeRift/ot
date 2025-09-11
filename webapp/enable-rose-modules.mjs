// Enable all modules for Rose alliance (ID 790) for testing
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function enableModulesForRose() {
  try {
    console.log('🔧 Enabling all modules for Rose alliance (ID: 790)...')
    
    // Get all available modules
    const modules = await prisma.module.findMany({
      where: { isActive: true }
    })
    
    console.log(`Found ${modules.length} active modules`)
    
    // Enable each module for Rose alliance
    for (const module of modules) {
      const result = await prisma.allianceModule.upsert({
        where: {
          allianceId_moduleId: {
            allianceId: 790,
            moduleId: module.id
          }
        },
        update: {
          enabled: true,
          enabledBy: 'system-test',
          enabledAt: new Date()
        },
        create: {
          allianceId: 790,
          moduleId: module.id,
          enabled: true,
          enabledBy: 'system-test'
        }
      })
      
      console.log(`✅ Enabled ${module.name} for Rose alliance`)
    }
    
    // Verify results
    const enabledModules = await prisma.allianceModule.findMany({
      where: {
        allianceId: 790,
        enabled: true
      },
      include: {
        module: true
      }
    })
    
    console.log('\n🎉 All modules enabled successfully!')
    console.log('\n📋 Rose alliance now has access to:')
    enabledModules.forEach(am => {
      console.log(`  • ${am.module.name} (${am.module.id})`)
    })
    
  } catch (error) {
    console.error('❌ Error enabling modules:', error)
  } finally {
    await prisma.$disconnect()
  }
}

enableModulesForRose()
