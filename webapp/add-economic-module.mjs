// Add Economic Tools module to the database
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addEconomicModule() {
  try {
    console.log('🔧 Adding Economic Tools module...')
    
    const module = await prisma.module.upsert({
      where: { id: 'economic' },
      update: {
        name: 'Economic Tools',
        description: 'Advanced tax management and member holdings tracking system',
        category: 'economic',
        requiredPerms: ['alliance_member'],
        isActive: true,
      },
      create: {
        id: 'economic',
        name: 'Economic Tools',
        description: 'Advanced tax management and member holdings tracking system',
        category: 'economic',
        requiredPerms: ['alliance_member'],
        isActive: true,
      },
    })
    
    console.log(`✅ ${module.name} (${module.id}) added successfully`)
    
    // Also enable it for Rose alliance for testing
    const allianceModule = await prisma.allianceModule.upsert({
      where: {
        allianceId_moduleId: {
          allianceId: 790,
          moduleId: 'economic'
        }
      },
      update: {
        enabled: true,
        enabledBy: 'system-test',
        enabledAt: new Date()
      },
      create: {
        allianceId: 790,
        moduleId: 'economic',
        enabled: true,
        enabledBy: 'system-test'
      }
    })
    
    console.log('✅ Economic Tools module enabled for Rose alliance')
    
  } catch (error) {
    console.error('❌ Error adding Economic Tools module:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addEconomicModule()
