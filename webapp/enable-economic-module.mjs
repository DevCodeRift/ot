// Enable economic module for alliance testing
// Run with: node enable-economic-module.mjs <allianceId>

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function enableEconomicModule() {
  const allianceId = process.argv[2]
  
  if (!allianceId) {
    console.log('Usage: node enable-economic-module.mjs <allianceId>')
    process.exit(1)
  }

  console.log(`🔧 Enabling economic module for alliance ${allianceId}...`)

  try {
    // First check if alliance exists
    const alliance = await prisma.alliance.findUnique({
      where: { id: parseInt(allianceId) }
    })

    if (!alliance) {
      console.log(`❌ Alliance ${allianceId} not found in database`)
      process.exit(1)
    }

    console.log(`✅ Found alliance: ${alliance.name} [${alliance.acronym || 'N/A'}]`)

    // Enable banking module (economic uses banking access)
    const bankingModule = await prisma.allianceModule.upsert({
      where: {
        allianceId_moduleId: {
          allianceId: parseInt(allianceId),
          moduleId: 'banking'
        }
      },
      update: {
        enabled: true
      },
      create: {
        allianceId: parseInt(allianceId),
        moduleId: 'banking',
        enabled: true
      }
    })

    console.log(`✅ Banking module enabled for ${alliance.name}`)

    // Enable economic module if it exists
    try {
      const economicModule = await prisma.allianceModule.upsert({
        where: {
          allianceId_moduleId: {
            allianceId: parseInt(allianceId),
            moduleId: 'economic'
          }
        },
        update: {
          enabled: true
        },
        create: {
          allianceId: parseInt(allianceId),
          moduleId: 'economic',
          enabled: true
        }
      })
      console.log(`✅ Economic module enabled for ${alliance.name}`)
    } catch (error) {
      console.log(`ℹ️  Economic module may not exist in modules table, banking access is sufficient`)
    }

    console.log(`\n🎉 Economic module access enabled for alliance ${alliance.name}!`)
    console.log(`\nUsers in this alliance can now:`)
    console.log(`- Access economic management tools`)
    console.log(`- Deposit resources to alliance bank via P&W API`)
    console.log(`- Withdraw resources from alliance bank via P&W API`)
    console.log(`- Manage tax brackets`)
    console.log(`- View holdings and transaction history`)

  } catch (error) {
    console.error('❌ Error enabling economic module:', error)
  } finally {
    await prisma.$disconnect()
  }
}

enableEconomicModule()
