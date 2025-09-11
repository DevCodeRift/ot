import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDB() {
  try {
    console.log('Testing database connection...')
    
    // Test modules
    const modules = await prisma.module.findMany()
    console.log('Modules found:', modules.length)
    console.log('Modules:', modules.map(m => ({ id: m.id, name: m.name, isActive: m.isActive })))
    
    // Test alliances  
    const alliances = await prisma.alliance.findMany()
    console.log('Alliances found:', alliances.length)
    console.log('Alliances:', alliances.map(a => ({ id: a.id, name: a.name })))
    
    // Test alliance modules
    const allianceModules = await prisma.allianceModule.findMany({
      include: {
        module: true,
        alliance: true
      }
    })
    console.log('Alliance modules found:', allianceModules.length)
    console.log('Alliance modules:', allianceModules.map(am => ({ 
      alliance: am.alliance.name, 
      module: am.module.name, 
      enabled: am.enabled 
    })))
    
  } catch (error) {
    console.error('Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDB()
