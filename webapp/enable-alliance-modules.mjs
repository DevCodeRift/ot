// Script to enable modules for any alliance
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function enableModulesForAlliance(allianceId, enabledBy = 'admin') {
  try {
    console.log(`🔧 Enabling modules for alliance ID: ${allianceId}...`)
    
    // Check if alliance exists
    const alliance = await prisma.alliance.findUnique({
      where: { id: allianceId }
    })
    
    if (!alliance) {
      console.error(`❌ Alliance with ID ${allianceId} not found`)
      return
    }
    
    console.log(`Found alliance: ${alliance.name} (${alliance.acronym})`)
    
    // Get all available modules
    const modules = await prisma.module.findMany({
      where: { isActive: true }
    })
    
    console.log(`Found ${modules.length} active modules`)
    
    // Enable each module for the alliance
    for (const module of modules) {
      const result = await prisma.allianceModule.upsert({
        where: {
          allianceId_moduleId: {
            allianceId: allianceId,
            moduleId: module.id
          }
        },
        update: {
          enabled: true,
          enabledBy: enabledBy,
          enabledAt: new Date()
        },
        create: {
          allianceId: allianceId,
          moduleId: module.id,
          enabled: true,
          enabledBy: enabledBy
        }
      })
      
      console.log(`✅ Enabled ${module.name} for ${alliance.name}`)
    }
    
    // Verify results
    const enabledModules = await prisma.allianceModule.findMany({
      where: {
        allianceId: allianceId,
        enabled: true
      },
      include: {
        module: true
      }
    })
    
    console.log(`\n🎉 Successfully enabled ${enabledModules.length} modules for ${alliance.name}:`)
    enabledModules.forEach(am => {
      console.log(`  • ${am.module.name} (${am.module.id})`)
    })
    
  } catch (error) {
    console.error('❌ Error enabling modules:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Usage examples:
// node enable-alliance-modules.mjs 123 admin-username
// node enable-alliance-modules.mjs 456

// Get command line arguments
const allianceId = parseInt(process.argv[2])
const enabledBy = process.argv[3] || 'admin'

if (!allianceId || isNaN(allianceId)) {
  console.error('Usage: node enable-alliance-modules.mjs <allianceId> [enabledBy]')
  console.error('Example: node enable-alliance-modules.mjs 123 admin-username')
  process.exit(1)
}

enableModulesForAlliance(allianceId, enabledBy)
